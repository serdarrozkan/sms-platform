import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/database';
import { generateToken } from '../middleware/auth';
import { AuthRequest } from '../types';

const registerSchema = z.object({
  email: z.string().email('Geçerli bir email adresi girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
});

const loginSchema = z.object({
  email: z.string().email('Geçerli bir email adresi girin'),
  password: z.string().min(1, 'Şifre gerekli'),
});

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: validation.error.errors[0].message,
      });
      return;
    }

    const { email, password } = validation.data;

    // Email kontrolü
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'Bu email adresi zaten kullanılıyor',
      });
      return;
    }

    // Şifre hash'le
    const hashedPassword = await bcrypt.hash(password, 12);

    // Kullanıcı oluştur
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        balance: true,
        role: true,
        createdAt: true,
      },
    });

    // Token oluştur
    const token = generateToken(user.id, user.email);

    res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Kayıt işlemi başarısız',
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: validation.error.errors[0].message,
      });
      return;
    }

    const { email, password } = validation.data;

    // Kullanıcı bul
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Email veya şifre hatalı',
      });
      return;
    }

    // Şifre kontrolü
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: 'Email veya şifre hatalı',
      });
      return;
    }

    // Hesap durumu kontrolü
    if (user.status === 'banned') {
      res.status(403).json({
        success: false,
        error: 'Hesabınız engellenmiş',
      });
      return;
    }

    // Token oluştur
    const token = generateToken(user.id, user.email);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          balance: user.balance,
          role: user.role,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Giriş işlemi başarısız',
    });
  }
};

export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Yetkilendirme gerekli',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: req.user.id,
        email: req.user.email,
        balance: req.user.balance,
        role: req.user.role,
        status: req.user.status,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({
      success: false,
      error: 'Kullanıcı bilgileri alınamadı',
    });
  }
};
