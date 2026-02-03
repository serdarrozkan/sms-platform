import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

export const adminMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Yetkilendirme gerekli',
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Bu işlem için admin yetkisi gerekli',
    });
    return;
  }

  next();
};
