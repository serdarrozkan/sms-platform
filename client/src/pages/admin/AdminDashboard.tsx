import { useEffect, useState } from 'react';
import { Users, ShoppingCart, CreditCard, DollarSign } from 'lucide-react';
import { Card } from '../../components/common';
import { adminService } from '../../services/adminService';

interface DashboardData {
  totalUsers: number;
  pendingDeposits: number;
  fivesimBalance: number;
  today: { orders: number; profit: number };
  week: { orders: number; profit: number };
  month: { orders: number; profit: number };
}

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const result = await adminService.getDashboard();
      setData(result);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Toplam Kullanıcı</p>
            <p className="text-2xl font-bold text-gray-900">{data?.totalUsers || 0}</p>
          </div>
        </Card>

        <Card className="flex items-center space-x-4">
          <div className="p-3 bg-yellow-100 rounded-lg">
            <CreditCard className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Bekleyen Talepler</p>
            <p className="text-2xl font-bold text-gray-900">{data?.pendingDeposits || 0}</p>
          </div>
        </Card>

        <Card className="flex items-center space-x-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">5sim Bakiye</p>
            <p className="text-2xl font-bold text-gray-900">{formatPrice(data?.fivesimBalance || 0)}</p>
          </div>
        </Card>

        <Card className="flex items-center space-x-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <ShoppingCart className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Bugünkü Sipariş</p>
            <p className="text-2xl font-bold text-gray-900">{data?.today.orders || 0}</p>
          </div>
        </Card>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4">Bugün</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Sipariş</span>
              <span className="font-medium">{data?.today.orders || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Kâr</span>
              <span className="font-medium text-green-600">{formatPrice(data?.today.profit || 0)}</span>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4">Bu Hafta</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Sipariş</span>
              <span className="font-medium">{data?.week.orders || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Kâr</span>
              <span className="font-medium text-green-600">{formatPrice(data?.week.profit || 0)}</span>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4">Bu Ay</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Sipariş</span>
              <span className="font-medium">{data?.month.orders || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Kâr</span>
              <span className="font-medium text-green-600">{formatPrice(data?.month.profit || 0)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
