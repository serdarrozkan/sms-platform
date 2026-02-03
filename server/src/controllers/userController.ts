import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { balanceService } from '../services/balanceService';
import { AuthRequest } from '../types';

const depositRequestSchema = z.object({
  amount: z.number().min(10, 'Minimum yükleme tutarı 10₺'),
  paymentMethod: z.string().min(1, 'Ödeme yöntemi gerekli'),
  paymentDetails: z.string().optional(),
});

export const getBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });
      return;
    }

    const balance = await balanceService.getBalance(req.user.id);

    res.json({
      success: true,
      data: { balance },
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Bakiye bilgisi alınamadı',
    });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await balanceService.getTransactions(req.user.id, page, limit);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'İşlem geçmişi alınamadı',
    });
  }
};

export const createDepositRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });
      return;
    }

    const validation = depositRequestSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: validation.error.errors[0].message,
      });
      return;
    }

    const { amount, paymentMethod, paymentDetails } = validation.data;

    const depositRequest = await prisma.depositRequest.create({
      data: {
        userId: req.user.id,
        amount,
        paymentMethod,
        paymentDetails,
      },
    });

    res.status(201).json({
      success: true,
      data: depositRequest,
      message: 'Bakiye yükleme talebi oluşturuldu',
    });
  } catch (error) {
    console.error('Create deposit request error:', error);
    res.status(500).json({
      success: false,
      error: 'Talep oluşturulamadı',
    });
  }
};

export const getDepositRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      prisma.depositRequest.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.depositRequest.count({ where: { userId: req.user.id } }),
    ]);

    res.json({
      success: true,
      data: {
        data: requests,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get deposit requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Talepler alınamadı',
    });
  }
};
