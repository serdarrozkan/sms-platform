import { Link } from 'react-router-dom';
import { LogOut, User, Wallet } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export function Header() {
  const { user, logout } = useAuthStore();

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(balance);
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary-600">SMS Platform</span>
          </Link>

          <div className="flex items-center space-x-4">
            {user && (
              <>
                <Link
                  to="/balance"
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Wallet className="w-4 h-4" />
                  <span className="font-medium">{formatBalance(user.balance)}</span>
                </Link>

                <div className="flex items-center space-x-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{user.email}</span>
                </div>

                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="text-sm text-gray-600 hover:text-primary-600"
                  >
                    Admin Panel
                  </Link>
                )}

                <button
                  onClick={logout}
                  className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Çıkış</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
