import api from './api';
import {
  Order,
  Product,
  Country,
  PriceInfo,
  BalanceTransaction,
  DepositRequest,
  ApiResponse,
  PaginatedResponse,
} from '../types';

export const orderService = {
  // Products
  async getProducts(): Promise<Product[]> {
    const response = await api.get<ApiResponse<Product[]>>('/products');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Ürünler alınamadı');
  },

  async getProductPrice(code: string, country: string): Promise<PriceInfo> {
    const response = await api.get<ApiResponse<PriceInfo>>(
      `/products/${code}/prices?country=${country}`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Fiyat bilgisi alınamadı');
  },

  // Countries
  async getCountries(): Promise<Country[]> {
    const response = await api.get<ApiResponse<Country[]>>('/countries');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Ülkeler alınamadı');
  },

  // Orders
  async createOrder(product: string, country: string, operator: string = 'any'): Promise<Order> {
    const response = await api.post<ApiResponse<{ order: Order }>>('/orders', {
      product,
      country,
      operator,
    });
    if (response.data.success && response.data.data) {
      return response.data.data.order;
    }
    throw new Error(response.data.error || 'Sipariş oluşturulamadı');
  },

  async getOrders(page: number = 1): Promise<PaginatedResponse<Order>> {
    const response = await api.get<ApiResponse<PaginatedResponse<Order>>>(
      `/orders?page=${page}`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Siparişler alınamadı');
  },

  async checkOrder(orderId: number): Promise<Order> {
    const response = await api.get<ApiResponse<Order>>(`/orders/${orderId}/check`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Sipariş kontrolü başarısız');
  },

  async finishOrder(orderId: number): Promise<void> {
    const response = await api.post<ApiResponse<void>>(`/orders/${orderId}/finish`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Sipariş tamamlanamadı');
    }
  },

  async cancelOrder(orderId: number): Promise<void> {
    const response = await api.post<ApiResponse<void>>(`/orders/${orderId}/cancel`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Sipariş iptal edilemedi');
    }
  },

  async banOrder(orderId: number): Promise<void> {
    const response = await api.post<ApiResponse<void>>(`/orders/${orderId}/ban`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Numara banlanamadı');
    }
  },

  // Balance
  async getBalance(): Promise<number> {
    const response = await api.get<ApiResponse<{ balance: number }>>('/user/balance');
    if (response.data.success && response.data.data) {
      return response.data.data.balance;
    }
    throw new Error(response.data.error || 'Bakiye alınamadı');
  },

  async getTransactions(page: number = 1): Promise<PaginatedResponse<BalanceTransaction>> {
    const response = await api.get<ApiResponse<PaginatedResponse<BalanceTransaction>>>(
      `/user/transactions?page=${page}`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'İşlem geçmişi alınamadı');
  },

  async createDepositRequest(
    amount: number,
    paymentMethod: string,
    paymentDetails?: string
  ): Promise<DepositRequest> {
    const response = await api.post<ApiResponse<DepositRequest>>('/user/deposit-request', {
      amount,
      paymentMethod,
      paymentDetails,
    });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Talep oluşturulamadı');
  },

  async getDepositRequests(page: number = 1): Promise<PaginatedResponse<DepositRequest>> {
    const response = await api.get<ApiResponse<PaginatedResponse<DepositRequest>>>(
      `/user/deposit-requests?page=${page}`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Talepler alınamadı');
  },
};
