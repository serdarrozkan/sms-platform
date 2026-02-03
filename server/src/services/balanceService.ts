import { prisma } from '../config/database';
import { TransactionType, User } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

class BalanceService {
  async getBalance(userId: number): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });
    return user ? parseFloat(user.balance.toString()) : 0;
  }

  async addBalance(
    userId: number,
    amount: number,
    type: TransactionType,
    description: string,
    referenceId?: number,
    adminId?: number
  ): Promise<User> {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      const balanceBefore = parseFloat(user.balance.toString());
      const balanceAfter = balanceBefore + amount;

      // Bakiye güncelle
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { balance: new Decimal(balanceAfter) },
      });

      // İşlem kaydı oluştur
      await tx.balanceTransaction.create({
        data: {
          userId,
          type,
          amount: new Decimal(amount),
          balanceBefore: new Decimal(balanceBefore),
          balanceAfter: new Decimal(balanceAfter),
          description,
          referenceId,
          adminId,
        },
      });

      return updatedUser;
    });
  }

  async deductBalance(
    userId: number,
    amount: number,
    type: TransactionType,
    description: string,
    referenceId?: number
  ): Promise<User> {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      const balanceBefore = parseFloat(user.balance.toString());

      if (balanceBefore < amount) {
        throw new Error('Yetersiz bakiye');
      }

      const balanceAfter = balanceBefore - amount;

      // Bakiye güncelle
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { balance: new Decimal(balanceAfter) },
      });

      // İşlem kaydı oluştur
      await tx.balanceTransaction.create({
        data: {
          userId,
          type,
          amount: new Decimal(-amount),
          balanceBefore: new Decimal(balanceBefore),
          balanceAfter: new Decimal(balanceAfter),
          description,
          referenceId,
        },
      });

      return updatedUser;
    });
  }

  async refundBalance(
    userId: number,
    amount: number,
    orderId: number
  ): Promise<User> {
    return this.addBalance(
      userId,
      amount,
      'refund',
      `Sipariş #${orderId} iade`,
      orderId
    );
  }

  async getTransactions(
    userId: number,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.balanceTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.balanceTransaction.count({ where: { userId } }),
    ]);

    return {
      data: transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const balanceService = new BalanceService();
