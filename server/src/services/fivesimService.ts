import axios, { AxiosInstance, AxiosError } from 'axios';
import { env } from '../config/env';
import {
  FivesimProfile,
  FivesimProducts,
  FivesimOrder,
} from '../types';

class FivesimService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.fivesimBaseUrl,
      headers: {
        Authorization: `Bearer ${env.fivesimApiKey}`,
        Accept: 'application/json',
      },
      timeout: 30000,
    });
  }

  private handleError(error: AxiosError): never {
    if (error.response) {
      const data = error.response.data as { message?: string };
      const message = data?.message || this.translateError(JSON.stringify(data));
      throw new Error(message);
    }
    throw new Error('5sim API ile bağlantı kurulamadı');
  }

  private translateError(errorText: string): string {
    const errorMap: Record<string, string> = {
      'no free phones': 'Müsait numara bulunamadı',
      'not enough user balance': '5sim bakiyesi yetersiz',
      'not enough rating': 'Rating yetersiz',
      'order not found': 'Sipariş bulunamadı',
      'order expired': 'Sipariş süresi doldu',
      'order has sms': 'SMS zaten alındı',
      'hosting order': 'Bu bir hosting siparişi',
      'bad country': 'Geçersiz ülke',
      'bad operator': 'Geçersiz operatör',
      'bad product': 'Geçersiz ürün',
    };

    for (const [key, value] of Object.entries(errorMap)) {
      if (errorText.toLowerCase().includes(key)) {
        return value;
      }
    }
    return `5sim hatası: ${errorText}`;
  }

  async getProfile(): Promise<FivesimProfile> {
    try {
      const response = await this.client.get<FivesimProfile>('/user/profile');
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getProducts(country: string, operator: string = 'any'): Promise<FivesimProducts> {
    try {
      const response = await this.client.get<FivesimProducts>(
        `/guest/products/${country}/${operator}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async buyActivation(
    country: string,
    operator: string,
    product: string
  ): Promise<FivesimOrder> {
    try {
      const response = await this.client.get<FivesimOrder>(
        `/user/buy/activation/${country}/${operator}/${product}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async checkOrder(orderId: number): Promise<FivesimOrder> {
    try {
      const response = await this.client.get<FivesimOrder>(`/user/check/${orderId}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async finishOrder(orderId: number): Promise<FivesimOrder> {
    try {
      const response = await this.client.get<FivesimOrder>(`/user/finish/${orderId}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async cancelOrder(orderId: number): Promise<FivesimOrder> {
    try {
      const response = await this.client.get<FivesimOrder>(`/user/cancel/${orderId}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async banOrder(orderId: number): Promise<FivesimOrder> {
    try {
      const response = await this.client.get<FivesimOrder>(`/user/ban/${orderId}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getCountries(): Promise<Record<string, unknown>> {
    try {
      const response = await this.client.get('/guest/countries');
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }
}

export const fivesimService = new FivesimService();
