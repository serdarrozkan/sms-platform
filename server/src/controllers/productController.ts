import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { fivesimService } from '../services/fivesimService';
import { pricingService } from '../services/pricingService';

export const getProducts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        icon: true,
      },
    });

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      error: 'Ürünler alınamadı',
    });
  }
};

export const getProductPrices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const country = (req.query.country as string) || 'russia';
    const operator = (req.query.operator as string) || 'any';

    // Ürün aktif mi kontrol et
    const product = await prisma.product.findUnique({
      where: { code },
    });

    if (!product || !product.isActive) {
      res.status(404).json({
        success: false,
        error: 'Ürün bulunamadı',
      });
      return;
    }

    // 5sim'den fiyatları al
    const fivesimProducts = await fivesimService.getProducts(country, operator);
    const productInfo = fivesimProducts[code];

    if (!productInfo) {
      res.status(404).json({
        success: false,
        error: 'Bu ülkede ürün bulunamadı',
      });
      return;
    }

    // Fiyat hesapla
    const pricing = await pricingService.calculatePrice(
      productInfo.Price,
      code,
      country
    );

    res.json({
      success: true,
      data: {
        product: code,
        country,
        operator,
        quantity: productInfo.Qty,
        price: pricing.sellPrice,
        originalPrice: productInfo.Price,
      },
    });
  } catch (error) {
    console.error('Get product prices error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Fiyat bilgisi alınamadı',
    });
  }
};
