import { Response } from 'express';
import { z } from 'zod';
import { orderService } from '../services/orderService';
import { AuthRequest } from '../types';

const createOrderSchema = z.object({
  country: z.string().min(1, 'Ülke gerekli'),
  operator: z.string().default('any'),
  product: z.string().min(1, 'Platform gerekli'),
});

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });
      return;
    }

    const validation = createOrderSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: validation.error.errors[0].message,
      });
      return;
    }

    const result = await orderService.createOrder({
      userId: req.user.id,
      ...validation.data,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Sipariş oluşturulamadı',
    });
  }
};

export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await orderService.getOrders(req.user.id, page, limit);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Siparişler alınamadı',
    });
  }
};

export const getOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });
      return;
    }

    const orderId = parseInt(req.params.id as string);
    const order = await orderService.getOrderById(orderId, req.user.id);

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Sipariş bulunamadı',
    });
  }
};

export const checkOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });
      return;
    }

    const orderId = parseInt(req.params.id as string);
    const result = await orderService.checkOrder(orderId, req.user.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Check order error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Sipariş kontrolü başarısız',
    });
  }
};

export const finishOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });
      return;
    }

    const orderId = parseInt(req.params.id as string);
    const result = await orderService.finishOrder(orderId, req.user.id);

    res.json({
      ...result,
    });
  } catch (error) {
    console.error('Finish order error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Sipariş tamamlanamadı',
    });
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });
      return;
    }

    const orderId = parseInt(req.params.id as string);
    const result = await orderService.cancelOrder(orderId, req.user.id);

    res.json({
      ...result,
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Sipariş iptal edilemedi',
    });
  }
};

export const banOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });
      return;
    }

    const orderId = parseInt(req.params.id as string);
    const result = await orderService.banOrder(orderId, req.user.id);

    res.json({
      ...result,
    });
  } catch (error) {
    console.error('Ban order error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Numara banlanamadı',
    });
  }
};
