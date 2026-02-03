import { Request } from 'express';
import { User } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: User;
}

// 5sim API Types
export interface FivesimProfile {
  id: number;
  email: string;
  balance: number;
  rating: number;
}

export interface FivesimProduct {
  Category: string;
  Qty: number;
  Price: number;
}

export interface FivesimProducts {
  [productCode: string]: FivesimProduct;
}

export interface FivesimOrder {
  id: number;
  phone: string;
  operator: string;
  product: string;
  price: number;
  status: string;
  expires: string;
  sms: FivesimSms[] | null;
  created_at: string;
  country: string;
}

export interface FivesimSms {
  id: number;
  created_at: string;
  date: string;
  sender: string;
  text: string;
  code: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Pagination
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
