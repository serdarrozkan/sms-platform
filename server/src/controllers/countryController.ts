import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const getCountries = async (_req: Request, res: Response): Promise<void> => {
  try {
    const countries = await prisma.country.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        flag: true,
      },
    });

    res.json({
      success: true,
      data: countries,
    });
  } catch (error) {
    console.error('Get countries error:', error);
    res.status(500).json({
      success: false,
      error: 'Ülkeler alınamadı',
    });
  }
};
