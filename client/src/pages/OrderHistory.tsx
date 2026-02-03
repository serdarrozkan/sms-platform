import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, StatusBadge, Button } from '../components/common';
import { orderService } from '../services/orderService';
import { Order, PaginatedResponse } from '../types';

export function OrderHistory() {
  const [orders, setOrders] = useState<PaginatedResponse<Order> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadOrders();
  }, [page]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const result = await orderService.getOrders(page);
      setOrders(result);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('tr-TR');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sipariş Geçmişi</h1>
        <p className="text-gray-600">Tüm siparişlerinizi görüntüleyin.</p>
      </div>

      <Card>
        <CardHeader title="Siparişler" />

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : !orders || orders.data.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Henüz sipariş yok</p>
            <Link to="/buy" className="text-primary-600 hover:text-primary-700 text-sm">
              İlk siparişinizi verin
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3 font-medium">#</th>
                    <th className="pb-3 font-medium">Platform</th>
                    <th className="pb-3 font-medium">Numara</th>
                    <th className="pb-3 font-medium">Ülke</th>
                    <th className="pb-3 font-medium">Fiyat</th>
                    <th className="pb-3 font-medium">Durum</th>
                    <th className="pb-3 font-medium">SMS Kodu</th>
                    <th className="pb-3 font-medium">Tarih</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.data.map((order) => (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="py-3 text-gray-500">#{order.id}</td>
                      <td className="py-3 font-medium">{order.product}</td>
                      <td className="py-3 font-mono text-sm">{order.phone}</td>
                      <td className="py-3">{order.country}</td>
                      <td className="py-3">{formatPrice(order.sellPrice)}</td>
                      <td className="py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-3 font-mono">
                        {order.smsCode || '-'}
                      </td>
                      <td className="py-3 text-gray-500 text-sm">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-3">
                        {(order.status === 'pending' || order.status === 'received') && (
                          <Link
                            to={`/order/${order.id}`}
                            className="text-primary-600 hover:text-primary-700 text-sm"
                          >
                            Detay
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {orders.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Toplam {orders.total} sipariş
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
                    {page} / {orders.totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page === orders.totalPages}
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
