export interface User {
  id: number;
  username: string;
  balance: number;
  role: 'user' | 'admin';
  status: 'active' | 'banned' | 'pending';
  createdAt: string;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  icon: string | null;
}

export interface Country {
  id: number;
  code: string;
  name: string;
  flag: string | null;
}

export interface Order {
  id: number;
  userId: number;
  fivesimOrderId: number;
  phone: string;
  product: string;
  country: string;
  operator: string;
  fivesimPrice: number;
  sellPrice: number;
  profit: number;
  status: OrderStatus;
  smsCode: string | null;
  smsText: string | null;
  expiresAt: string;
  createdAt: string;
}

export type OrderStatus = 'pending' | 'received' | 'finished' | 'canceled' | 'banned' | 'timeout';

export interface BalanceTransaction {
  id: number;
  userId: number;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
}

export type TransactionType = 'deposit' | 'withdraw' | 'purchase' | 'refund' | 'admin_add' | 'admin_remove';

export interface DepositRequest {
  id: number;
  userId: number;
  amount: number;
  paymentMethod: string;
  paymentDetails: string | null;
  status: 'pending' | 'approved' | 'rejected';
  adminNote: string | null;
  createdAt: string;
}

export interface PriceInfo {
  product: string;
  country: string;
  operator: string;
  quantity: number;
  price: number;
  originalPrice: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
