import api from './api';
import {
  User,
  Order,
  Product,
  Country,
  DepositRequest,
  ApiResponse,
  PaginatedResponse,
} from '../types';

interface DashboardData {
  totalUsers: number;
  pendingDeposits: number;
  fivesimBalance: number;
  today: { orders: number; profit: number };
  week: { orders: number; profit: number };
  month: { orders: number; profit: number };
}

interface AdminLog {
  id: number;
  adminId: number;
  action: string;
  targetType: string | null;
  targetId: number | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  admin: { id: number; email: string };
}

export const adminService = {
  // Dashboard
  async getDashboard(): Promise<DashboardData> {
    const response = await api.get<ApiResponse<DashboardData>>('/admin/dashboard');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Dashboard yüklenemedi');
  },

  // Users
  async getUsers(page: number = 1, search?: string): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams({ page: page.toString() });
    if (search) params.append('search', search);

    const response = await api.get<ApiResponse<PaginatedResponse<User>>>(
      `/admin/users?${params}`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Kullanıcılar alınamadı');
  },

  async updateUser(userId: number, data: { status?: string; role?: string }): Promise<void> {
    const response = await api.patch<ApiResponse<void>>(`/admin/users/${userId}`, data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Kullanıcı güncellenemedi');
    }
  },

  async addUserBalance(userId: number, amount: number, description?: string): Promise<void> {
    const response = await api.post<ApiResponse<void>>(`/admin/users/${userId}/balance`, {
      amount,
      description,
    });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Bakiye eklenemedi');
    }
  },

  // Orders
  async getOrders(page: number = 1): Promise<PaginatedResponse<Order & { user: { id: number; email: string } }>> {
    const response = await api.get<ApiResponse<PaginatedResponse<Order & { user: { id: number; email: string } }>>>(
      `/admin/orders?page=${page}`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Siparişler alınamadı');
  },

  // Deposits
  async getDeposits(page: number = 1, status?: string): Promise<PaginatedResponse<DepositRequest & { user: { id: number; email: string } }>> {
    const params = new URLSearchParams({ page: page.toString() });
    if (status) params.append('status', status);

    const response = await api.get<ApiResponse<PaginatedResponse<DepositRequest & { user: { id: number; email: string } }>>>(
      `/admin/deposits?${params}`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Talepler alınamadı');
  },

  async updateDeposit(depositId: number, status: 'approved' | 'rejected', adminNote?: string): Promise<void> {
    const response = await api.patch<ApiResponse<void>>(`/admin/deposits/${depositId}`, {
      status,
      adminNote,
    });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Talep güncellenemedi');
    }
  },

  // Products
  async getProducts(): Promise<Product[]> {
    const response = await api.get<ApiResponse<Product[]>>('/admin/products');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Ürünler alınamadı');
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    const response = await api.post<ApiResponse<Product>>('/admin/products', data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Ürün oluşturulamadı');
  },

  async updateProduct(productId: number, data: Partial<Product>): Promise<void> {
    const response = await api.patch<ApiResponse<void>>(`/admin/products/${productId}`, data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Ürün güncellenemedi');
    }
  },

  async deleteProduct(productId: number): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(`/admin/products/${productId}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Ürün silinemedi');
    }
  },

  // Countries
  async getCountries(): Promise<Country[]> {
    const response = await api.get<ApiResponse<Country[]>>('/admin/countries');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Ülkeler alınamadı');
  },

  async createCountry(data: Partial<Country>): Promise<Country> {
    const response = await api.post<ApiResponse<Country>>('/admin/countries', data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Ülke oluşturulamadı');
  },

  async updateCountry(countryId: number, data: Partial<Country>): Promise<void> {
    const response = await api.patch<ApiResponse<void>>(`/admin/countries/${countryId}`, data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Ülke güncellenemedi');
    }
  },

  async deleteCountry(countryId: number): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(`/admin/countries/${countryId}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Ülke silinemedi');
    }
  },

  // Settings
  async getSettings(): Promise<Record<string, string>> {
    const response = await api.get<ApiResponse<Record<string, string>>>('/admin/settings');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Ayarlar alınamadı');
  },

  async updateSettings(settings: Record<string, string>): Promise<void> {
    const response = await api.patch<ApiResponse<void>>('/admin/settings', settings);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Ayarlar güncellenemedi');
    }
  },

  // 5sim
  async getFivesimBalance(): Promise<{ balance: number; rating: number }> {
    const response = await api.get<ApiResponse<{ balance: number; rating: number }>>('/admin/fivesim/balance');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || '5sim bakiyesi alınamadı');
  },

  // Logs
  async getLogs(page: number = 1): Promise<PaginatedResponse<AdminLog>> {
    const response = await api.get<ApiResponse<PaginatedResponse<AdminLog>>>(
      `/admin/logs?page=${page}`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Loglar alınamadı');
  },
};
