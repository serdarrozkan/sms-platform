import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Globe,
  CreditCard,
  Settings,
  FileText,
  ArrowLeft,
} from 'lucide-react';

const adminMenuItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/users', icon: Users, label: 'Kullanıcılar' },
  { path: '/admin/orders', icon: ShoppingCart, label: 'Siparişler' },
  { path: '/admin/deposits', icon: CreditCard, label: 'Bakiye Talepleri' },
  { path: '/admin/products', icon: Package, label: 'Platformlar' },
  { path: '/admin/countries', icon: Globe, label: 'Ülkeler' },
  { path: '/admin/settings', icon: Settings, label: 'Ayarlar' },
  { path: '/admin/logs', icon: FileText, label: 'Loglar' },
];

export function AdminLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <header className="bg-gray-800 text-white">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2 text-gray-300 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Siteye Dön</span>
            </Link>
            <span className="text-xl font-bold">Admin Panel</span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Admin Sidebar */}
        <aside className="w-64 bg-gray-800 min-h-[calc(100vh-3rem)]">
          <nav className="p-4 space-y-1">
            {adminMenuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Admin Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
