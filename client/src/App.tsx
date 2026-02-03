import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { Layout, AdminLayout } from './components/layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { BuyNumber } from './pages/BuyNumber';
import { OrderStatus } from './pages/OrderStatus';
import { OrderHistory } from './pages/OrderHistory';
import { Balance } from './pages/Balance';
import { DepositRequest } from './pages/DepositRequest';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Users } from './pages/admin/Users';
import { Orders } from './pages/admin/Orders';
import { Deposits } from './pages/admin/Deposits';
import { Products } from './pages/admin/Products';
import { Countries } from './pages/admin/Countries';
import { Settings } from './pages/admin/Settings';
import { Logs } from './pages/admin/Logs';

function App() {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />

      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected User Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="buy" element={<BuyNumber />} />
          <Route path="order/:id" element={<OrderStatus />} />
          <Route path="orders" element={<OrderHistory />} />
          <Route path="balance" element={<Balance />} />
          <Route path="deposit" element={<DepositRequest />} />
        </Route>

        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="orders" element={<Orders />} />
          <Route path="deposits" element={<Deposits />} />
          <Route path="products" element={<Products />} />
          <Route path="countries" element={<Countries />} />
          <Route path="settings" element={<Settings />} />
          <Route path="logs" element={<Logs />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
