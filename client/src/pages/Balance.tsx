import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpCircle, ArrowDownCircle, Plus } from 'lucide-react';
import { Card, CardHeader, Button } from '../components/common';
import { useAuthStore } from '../store/authStore';
import { orderService } from '../services/orderService';
import { BalanceTransaction, PaginatedResponse } from '../types';

export function Balance() {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<PaginatedResponse<BalanceTransaction> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadTransactions();
  }, [page]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const result = await orderService.getTransactions(page);
      setTransactions(result);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('tr-TR');
  };

  const getTransactionIcon = (type: string) => {
    const isPositive = ['deposit', 'refund', 'admin_add'].includes(type);
    return isPositive ? (
      <ArrowUpCircle className="w-5 h-5 text-green-500" />
    ) : (
      <ArrowDownCircle className="w-5 h-5 text-red-500" />
    );
  };

  const getTransactionLabel = (type: string) => {
    const labels: Record<string, string> = {
      deposit: 'Bakiye Yükleme',
      withdraw: 'Çekim',
      purchase: 'Satın Alma',
      refund: 'İade',
      admin_add: 'Admin Ekleme',
      admin_remove: 'Admin Çıkarma',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bakiye</h1>
          <p className="text-gray-600">Bakiye durumunuz ve işlem geçmişiniz.</p>
        </div>
        <Link to="/deposit">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Bakiye Yükle
          </Button>
        </Link>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="text-center py-4">
          <p className="text-primary-100 text-sm">Mevcut Bakiye</p>
          <p className="text-4xl font-bold mt-2">
            {formatPrice(user?.balance || 0)}
          </p>
        </div>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader title="İşlem Geçmişi" />

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : !transactions || transactions.data.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Henüz işlem yok</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {transactions.data.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getTransactionIcon(tx.type)}
                    <div>
                      <p className="font-medium">{getTransactionLabel(tx.type)}</p>
                      <p className="text-sm text-gray-500">{tx.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-medium ${
                        tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {tx.amount > 0 ? '+' : ''}
                      {formatPrice(tx.amount)}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(tx.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {transactions.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Toplam {transactions.total} işlem
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page === 1}
                  >
                    Önceki
                  </Button>
                  <span className="px-3 py-1 text-sm">
                    {page} / {transactions.totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page === transactions.totalPages}
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
