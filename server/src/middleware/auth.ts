import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { AuthRequest } from '../types';

interface JwtPayload {
  userId: number;
  username: string;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Yetkilendirme token\'ı gerekli',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Kullanıcı bulunamadı',
      });
      return;
    }

    if (user.status === 'banned') {
      res.status(403).json({
        success: false,
        error: 'Hesabınız engellenmiş',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Geçersiz token',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Sunucu hatası',
    });
  }
};

export const generateToken = (userId: number, username: string): string => {
  return jwt.sign(
    { userId, username },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn } as jwt.SignOptions
  );
};
