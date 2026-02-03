import { prisma } from '../config/database';
import { Decimal } from '@prisma/client/runtime/library';

interface PriceCalculation {
  fivesimPrice: number;
  sellPrice: number;
  profit: number;
}

class PricingService {
  private defaultMargin = 30; // %30 varsayılan kâr marjı

  async getDefaultMargin(): Promise<number> {
    const setting = await prisma.setting.findUnique({
      where: { key: 'default_profit_margin' },
    });
    return setting ? parseFloat(setting.value) : this.defaultMargin;
  }

  async calculatePrice(
    fivesimPrice: number,
    productCode: string,
    countryCode: string
  ): Promise<PriceCalculation> {
    // Varsayılan marjı al
    const defaultMargin = await this.getDefaultMargin();

    // Ürün özel marjını kontrol et
    const product = await prisma.product.findUnique({
      where: { code: productCode },
    });
    const productMargin = product?.profitMargin
      ? parseFloat(product.profitMargin.toString())
      : defaultMargin;

    // Ülke ek marjını kontrol et
    const country = await prisma.country.findUnique({
      where: { code: countryCode },
    });
    const countryExtra = country?.extraMargin
      ? parseFloat(country.extraMargin.toString())
      : 0;

    // Toplam marj hesapla
    const totalMargin = productMargin + countryExtra;

    // Satış fiyatı hesapla
    const sellPrice = fivesimPrice * (1 + totalMargin / 100);

    // Yukarı yuvarla (2 ondalık)
    const roundedSellPrice = Math.ceil(sellPrice * 100) / 100;

    // Kâr hesapla
    const profit = roundedSellPrice - fivesimPrice;

    return {
      fivesimPrice,
      sellPrice: roundedSellPrice,
      profit: Math.round(profit * 10000) / 10000,
    };
  }

  toDecimal(value: number): Decimal {
    return new Decimal(value);
  }
}

export const pricingService = new PricingService();
