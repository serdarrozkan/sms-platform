import { useEffect, useState } from 'react';
import { Card, CardHeader, Button, StatusBadge } from '../../components/common';
import { adminService } from '../../services/adminService';
import { Order, PaginatedResponse } from '../../types';

type OrderWithUser = Order & { user: { id: number; username: string } };

export function Orders() {
  const [orders, setOrders] = useState<PaginatedResponse<OrderWithUser> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadOrders();
  }, [page]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const result = await adminService.getOrders(page);
      setOrders(result);
    } catch (error) {
      console.error('Failed to load orders:', error);
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Siparişler</h1>

      <Card>
        <CardHeader title="Tüm Siparişler" />

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3 font-medium">#</th>
                    <th className="pb-3 font-medium">Kullanıcı</th>
                    <th className="pb-3 font-medium">Platform</th>
                    <th className="pb-3 font-medium">Numara</th>
                    <th className="pb-3 font-medium">Ülke</th>
                    <th className="pb-3 font-medium">5sim</th>
                    <th className="pb-3 font-medium">Satış</th>
                    <th className="pb-3 font-medium">Kâr</th>
                    <th className="pb-3 font-medium">Durum</th>
                    <th className="pb-3 font-medium">SMS</th>
                    <th className="pb-3 font-medium">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {orders?.data.map((order) => (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="py-3">{order.id}</td>
                      <td className="py-3 text-sm">{order.user.username}</td>
                      <td className="py-3 font-medium">{order.product}</td>
                      <td className="py-3 font-mono text-sm">{order.phone}</td>
                      <td className="py-3">{order.country}</td>
                      <td className="py-3 text-sm text-gray-500">{formatPrice(order.fivesimPrice)}</td>
                      <td className="py-3 text-sm">{formatPrice(order.sellPrice)}</td>
                      <td className="py-3 text-sm text-green-600">{formatPrice(order.profit)}</td>
                      <td className="py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-3 font-mono text-sm">{order.smsCode || '-'}</td>
                      <td className="py-3 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {orders && orders.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">Toplam {orders.total} sipariş</p>
                <div className="flex space-x-2">
                  <Button variant="secondary" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                    Önceki
                  </Button>
                  <span className="px-3 py-1 text-sm">{page} / {orders.totalPages}</span>
                  <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === orders.totalPages}>
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
