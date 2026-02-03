import { prisma } from '../config/database';
import { OrderStatus } from '@prisma/client';
import { fivesimService } from './fivesimService';
import { pricingService } from './pricingService';
import { balanceService } from './balanceService';
import { Decimal } from '@prisma/client/runtime/library';

interface CreateOrderParams {
  userId: number;
  country: string;
  operator: string;
  product: string;
}

class OrderService {
  async createOrder(params: CreateOrderParams) {
    const { userId, country, operator, product } = params;

    // 1. Ürün fiyatını al
    const products = await fivesimService.getProducts(country, operator);
    const productInfo = products[product];

    if (!productInfo) {
      throw new Error('Ürün bulunamadı veya stokta yok');
    }

    if (productInfo.Qty === 0) {
      throw new Error('Bu ürün şu anda stokta yok');
    }

    // 2. Fiyat hesapla
    const pricing = await pricingService.calculatePrice(
      productInfo.Price,
      product,
      country
    );

    // 3. Bakiye kontrolü
    const userBalance = await balanceService.getBalance(userId);
    if (userBalance < pricing.sellPrice) {
      throw new Error(
        `Yetersiz bakiye. Gerekli: ${pricing.sellPrice.toFixed(2)}₺, Mevcut: ${userBalance.toFixed(2)}₺`
      );
    }

    // 4. 5sim'den numara al
    const fivesimOrder = await fivesimService.buyActivation(country, operator, product);

    // 5. Bakiyeden düş
    await balanceService.deductBalance(
      userId,
      pricing.sellPrice,
      'purchase',
      `${product} - ${fivesimOrder.phone}`,
      fivesimOrder.id
    );

    // 6. Sipariş kaydı oluştur
    const order = await prisma.order.create({
      data: {
        userId,
        fivesimOrderId: fivesimOrder.id,
        phone: fivesimOrder.phone,
        product,
        country,
        operator: fivesimOrder.operator,
        fivesimPrice: new Decimal(productInfo.Price),
        sellPrice: new Decimal(pricing.sellPrice),
        profit: new Decimal(pricing.profit),
        status: 'pending',
        expiresAt: new Date(fivesimOrder.expires),
      },
    });

    return {
      order,
      phone: fivesimOrder.phone,
      expiresAt: fivesimOrder.expires,
    };
  }

  async checkOrder(orderId: number, userId: number) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new Error('Sipariş bulunamadı');
    }

    // 5sim'den durumu kontrol et
    const fivesimOrder = await fivesimService.checkOrder(order.fivesimOrderId);

    // SMS gelmiş mi?
    let smsCode: string | null = null;
    let smsText: string | null = null;

    if (fivesimOrder.sms && fivesimOrder.sms.length > 0) {
      smsCode = fivesimOrder.sms[0].code;
      smsText = fivesimOrder.sms[0].text;

      // Veritabanını güncelle
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'received',
          smsCode,
          smsText,
        },
      });
    }

    // Status mapping
    const statusMap: Record<string, OrderStatus> = {
      PENDING: 'pending',
      RECEIVED: 'received',
      CANCELED: 'canceled',
      TIMEOUT: 'timeout',
      FINISHED: 'finished',
      BANNED: 'banned',
    };

    const newStatus = statusMap[fivesimOrder.status] || 'pending';

    if (newStatus !== order.status) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });
    }

    return {
      id: order.id,
      phone: order.phone,
      status: newStatus,
      smsCode,
      smsText,
      expiresAt: order.expiresAt,
      product: order.product,
      country: order.country,
    };
  }

  async finishOrder(orderId: number, userId: number) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new Error('Sipariş bulunamadı');
    }

    if (order.status === 'finished') {
      throw new Error('Sipariş zaten tamamlanmış');
    }

    await fivesimService.finishOrder(order.fivesimOrderId);

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'finished' },
    });

    return { success: true, message: 'Sipariş tamamlandı' };
  }

  async cancelOrder(orderId: number, userId: number) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new Error('Sipariş bulunamadı');
    }

    if (order.status !== 'pending') {
      throw new Error('Sadece bekleyen siparişler iptal edilebilir');
    }

    await fivesimService.cancelOrder(order.fivesimOrderId);

    // Bakiye iade et
    await balanceService.refundBalance(
      userId,
      parseFloat(order.sellPrice.toString()),
      orderId
    );

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'canceled' },
    });

    return { success: true, message: 'Sipariş iptal edildi ve bakiye iade edildi' };
  }

  async banOrder(orderId: number, userId: number) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new Error('Sipariş bulunamadı');
    }

    await fivesimService.banOrder(order.fivesimOrderId);

    // Bakiye iade et
    await balanceService.refundBalance(
      userId,
      parseFloat(order.sellPrice.toString()),
      orderId
    );

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'banned' },
    });

    return { success: true, message: 'Numara banlandı ve bakiye iade edildi' };
  }

  async getOrders(userId: number, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    return {
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOrderById(orderId: number, userId: number) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new Error('Sipariş bulunamadı');
    }

    return order;
  }
}

export const orderService = new OrderService();
