import { Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { balanceService } from '../services/balanceService';
import { fivesimService } from '../services/fivesimService';
import { AuthRequest } from '../types';
import { Decimal } from '@prisma/client/runtime/library';

// Schemas
const updateUserSchema = z.object({
  status: z.enum(['active', 'banned', 'pending']).optional(),
  role: z.enum(['user', 'admin']).optional(),
});

const addBalanceSchema = z.object({
  amount: z.number(),
  description: z.string().optional(),
});

const updateDepositSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  adminNote: z.string().optional(),
});

const productSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  icon: z.string().optional(),
  isActive: z.boolean().optional(),
  profitMargin: z.number().optional(),
  sortOrder: z.number().optional(),
});

const countrySchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  flag: z.string().optional(),
  isActive: z.boolean().optional(),
  extraMargin: z.number().optional(),
  sortOrder: z.number().optional(),
});

const settingsSchema = z.record(z.string());

// Helper: Log admin action
async function logAdminAction(
  adminId: number,
  action: string,
  targetType: string | null,
  targetId: number | null,
  details: object | null,
  ipAddress: string | null
) {
  await prisma.adminLog.create({
    data: {
      adminId,
      action,
      targetType,
      targetId,
      details: details ?? undefined,
      ipAddress,
    },
  });
}

// Dashboard
export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      todayOrders,
      weekOrders,
      monthOrders,
      pendingDeposits,
      fivesimBalance,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.order.aggregate({
        where: { createdAt: { gte: todayStart } },
        _sum: { profit: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: weekStart } },
        _sum: { profit: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: monthStart } },
        _sum: { profit: true },
        _count: true,
      }),
      prisma.depositRequest.count({ where: { status: 'pending' } }),
      fivesimService.getProfile().catch(() => null),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        pendingDeposits,
        fivesimBalance: fivesimBalance?.balance || 0,
        today: {
          orders: todayOrders._count,
          profit: todayOrders._sum.profit || 0,
        },
        week: {
          orders: weekOrders._count,
          profit: weekOrders._sum.profit || 0,
        },
        month: {
          orders: monthOrders._count,
          profit: monthOrders._sum.profit || 0,
        },
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, error: 'Dashboard yüklenemedi' });
  }
};

// Users
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const where = search
      ? { email: { contains: search } }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          balance: true,
          role: true,
          status: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: { data: users, total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Kullanıcılar alınamadı' });
  }
};

export const getUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.id as string);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        balance: true,
        role: true,
        status: true,
        createdAt: true,
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        balanceTransactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: 'Kullanıcı bilgisi alınamadı' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.id as string);
    const validation = updateUserSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({ success: false, error: validation.error.errors[0].message });
      return;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: validation.data,
      select: { id: true, email: true, role: true, status: true },
    });

    await logAdminAction(
      req.user!.id,
      'user_update',
      'user',
      userId,
      validation.data,
      req.ip || null
    );

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: 'Kullanıcı güncellenemedi' });
  }
};

export const addUserBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.id as string);
    const validation = addBalanceSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({ success: false, error: validation.error.errors[0].message });
      return;
    }

    const { amount, description } = validation.data;
    const type = amount > 0 ? 'admin_add' : 'admin_remove';

    const user = await balanceService.addBalance(
      userId,
      amount,
      type,
      description || `Admin tarafından ${amount > 0 ? 'eklendi' : 'çıkarıldı'}`,
      undefined,
      req.user!.id
    );

    await logAdminAction(
      req.user!.id,
      'balance_change',
      'user',
      userId,
      { amount, description },
      req.ip || null
    );

    res.json({
      success: true,
      data: { newBalance: user.balance },
      message: `Bakiye ${amount > 0 ? 'eklendi' : 'çıkarıldı'}`,
    });
  } catch (error) {
    console.error('Add balance error:', error);
    res.status(500).json({ success: false, error: 'Bakiye değiştirilemedi' });
  }
};

// Orders (Admin)
export const getAllOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        include: { user: { select: { id: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count(),
    ]);

    res.json({
      success: true,
      data: { data: orders, total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ success: false, error: 'Siparişler alınamadı' });
  }
};

// Deposits
export const getDeposits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const where = status ? { status: status as 'pending' | 'approved' | 'rejected' } : {};

    const [deposits, total] = await Promise.all([
      prisma.depositRequest.findMany({
        where,
        include: { user: { select: { id: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.depositRequest.count({ where }),
    ]);

    res.json({
      success: true,
      data: { data: deposits, total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get deposits error:', error);
    res.status(500).json({ success: false, error: 'Talepler alınamadı' });
  }
};

export const updateDeposit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const depositId = parseInt(req.params.id as string);
    const validation = updateDepositSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({ success: false, error: validation.error.errors[0].message });
      return;
    }

    const { status, adminNote } = validation.data;

    const deposit = await prisma.depositRequest.findUnique({
      where: { id: depositId },
    });

    if (!deposit) {
      res.status(404).json({ success: false, error: 'Talep bulunamadı' });
      return;
    }

    if (deposit.status !== 'pending') {
      res.status(400).json({ success: false, error: 'Bu talep zaten işlenmiş' });
      return;
    }

    // Onaylandıysa bakiye ekle
    if (status === 'approved') {
      await balanceService.addBalance(
        deposit.userId,
        parseFloat(deposit.amount.toString()),
        'deposit',
        `Bakiye yükleme #${depositId}`,
        depositId,
        req.user!.id
      );
    }

    const updated = await prisma.depositRequest.update({
      where: { id: depositId },
      data: {
        status,
        adminNote,
        processedBy: req.user!.id,
        processedAt: new Date(),
      },
    });

    await logAdminAction(
      req.user!.id,
      'deposit_process',
      'deposit',
      depositId,
      { status, adminNote },
      req.ip || null
    );

    res.json({
      success: true,
      data: updated,
      message: status === 'approved' ? 'Talep onaylandı' : 'Talep reddedildi',
    });
  } catch (error) {
    console.error('Update deposit error:', error);
    res.status(500).json({ success: false, error: 'Talep güncellenemedi' });
  }
};

// Products
export const getAdminProducts = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, error: 'Ürünler alınamadı' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validation = productSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, error: validation.error.errors[0].message });
      return;
    }

    const product = await prisma.product.create({
      data: {
        ...validation.data,
        profitMargin: validation.data.profitMargin
          ? new Decimal(validation.data.profitMargin)
          : null,
      },
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, error: 'Ürün oluşturulamadı' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const productId = parseInt(req.params.id as string);
    const validation = productSchema.partial().safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({ success: false, error: validation.error.errors[0].message });
      return;
    }

    const data = { ...validation.data };
    if (data.profitMargin !== undefined) {
      (data as Record<string, unknown>).profitMargin = data.profitMargin
        ? new Decimal(data.profitMargin)
        : null;
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data,
    });

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, error: 'Ürün güncellenemedi' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const productId = parseInt(req.params.id as string);
    await prisma.product.delete({ where: { id: productId } });
    res.json({ success: true, message: 'Ürün silindi' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, error: 'Ürün silinemedi' });
  }
};

// Countries
export const getAdminCountries = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const countries = await prisma.country.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: countries });
  } catch (error) {
    console.error('Get countries error:', error);
    res.status(500).json({ success: false, error: 'Ülkeler alınamadı' });
  }
};

export const createCountry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validation = countrySchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, error: validation.error.errors[0].message });
      return;
    }

    const country = await prisma.country.create({
      data: {
        ...validation.data,
        extraMargin: new Decimal(validation.data.extraMargin || 0),
      },
    });

    res.status(201).json({ success: true, data: country });
  } catch (error) {
    console.error('Create country error:', error);
    res.status(500).json({ success: false, error: 'Ülke oluşturulamadı' });
  }
};

export const updateCountry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const countryId = parseInt(req.params.id as string);
    const validation = countrySchema.partial().safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({ success: false, error: validation.error.errors[0].message });
      return;
    }

    const data = { ...validation.data };
    if (data.extraMargin !== undefined) {
      (data as Record<string, unknown>).extraMargin = new Decimal(data.extraMargin);
    }

    const country = await prisma.country.update({
      where: { id: countryId },
      data,
    });

    res.json({ success: true, data: country });
  } catch (error) {
    console.error('Update country error:', error);
    res.status(500).json({ success: false, error: 'Ülke güncellenemedi' });
  }
};

export const deleteCountry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const countryId = parseInt(req.params.id as string);
    await prisma.country.delete({ where: { id: countryId } });
    res.json({ success: true, message: 'Ülke silindi' });
  } catch (error) {
    console.error('Delete country error:', error);
    res.status(500).json({ success: false, error: 'Ülke silinemedi' });
  }
};

// Settings
export const getSettings = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const settings = await prisma.setting.findMany();
    const settingsObj = settings.reduce(
      (acc, s) => ({ ...acc, [s.key]: s.value }),
      {} as Record<string, string>
    );
    res.json({ success: true, data: settingsObj });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, error: 'Ayarlar alınamadı' });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validation = settingsSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, error: 'Geçersiz ayarlar' });
      return;
    }

    for (const [key, value] of Object.entries(validation.data)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    await logAdminAction(
      req.user!.id,
      'settings_update',
      null,
      null,
      validation.data,
      req.ip || null
    );

    res.json({ success: true, message: 'Ayarlar güncellendi' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, error: 'Ayarlar güncellenemedi' });
  }
};

// 5sim
export const getFivesimBalance = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await fivesimService.getProfile();
    res.json({
      success: true,
      data: {
        balance: profile.balance,
        rating: profile.rating,
      },
    });
  } catch (error) {
    console.error('Get 5sim balance error:', error);
    res.status(500).json({ success: false, error: '5sim bakiyesi alınamadı' });
  }
};

// Logs
export const getLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        include: { admin: { select: { id: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.adminLog.count(),
    ]);

    res.json({
      success: true,
      data: { data: logs, total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ success: false, error: 'Loglar alınamadı' });
  }
};

// Reports
export const getRevenueReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await prisma.order.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: startDate } },
      _sum: { profit: true, sellPrice: true },
      _count: true,
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Get revenue report error:', error);
    res.status(500).json({ success: false, error: 'Rapor alınamadı' });
  }
};
