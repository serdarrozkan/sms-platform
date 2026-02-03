import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Clock, CheckCircle, Wallet } from 'lucide-react';
import { Card, CardHeader, StatusBadge } from '../components/common';
import { useAuthStore } from '../store/authStore';
import { orderService } from '../services/orderService';
import { Order } from '../types';

export function Dashboard() {
  const { user } = useAuthStore();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecentOrders();
  }, []);

  const loadRecentOrders = async () => {
    try {
      const result = await orderService.getOrders(1);
      setRecentOrders(result.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(balance);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('tr-TR');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hoş Geldiniz!</h1>
        <p className="text-gray-600">SMS doğrulama platformuna hoş geldiniz.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center space-x-4">
          <div className="p-3 bg-primary-100 rounded-lg">
            <Wallet className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Bakiye</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatBalance(user?.balance || 0)}
            </p>
          </div>
        </Card>

        <Link to="/buy">
          <Card className="flex items-center space-x-4 hover:border-primary-300 transition-colors cursor-pointer">
            <div className="p-3 bg-green-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Hemen Numara Al</p>
              <p className="text-lg font-semibold text-gray-900">Satın Al</p>
            </div>
          </Card>
        </Link>

        <Link to="/orders">
          <Card className="flex items-center space-x-4 hover:border-primary-300 transition-colors cursor-pointer">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Siparişlerim</p>
              <p className="text-lg font-semibold text-gray-900">Geçmişi Gör</p>
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader
          title="Son Siparişler"
          action={
            <Link to="/orders" className="text-sm text-primary-600 hover:text-primary-700">
              Tümünü Gör
            </Link>
          }
        />

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Henüz sipariş yok</p>
            <Link to="/buy" className="text-primary-600 hover:text-primary-700 text-sm">
              İlk siparişinizi verin
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3 font-medium">Platform</th>
                  <th className="pb-3 font-medium">Numara</th>
                  <th className="pb-3 font-medium">Durum</th>
                  <th className="pb-3 font-medium">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{order.product}</td>
                    <td className="py-3 text-gray-600">{order.phone}</td>
                    <td className="py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3 text-gray-500 text-sm">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
