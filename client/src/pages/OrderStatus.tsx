import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Copy, Check, X, Ban, Clock } from 'lucide-react';
import { Card, Button, StatusBadge } from '../components/common';
import { orderService } from '../services/orderService';
import { useAuthStore } from '../store/authStore';
import { Order } from '../types';

export function OrderStatus() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateBalance, user } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const checkOrder = useCallback(async () => {
    if (!id) return;

    try {
      const data = await orderService.checkOrder(parseInt(id));
      setOrder(data as Order);

      // Calculate time left
      const expires = new Date(data.expiresAt).getTime();
      const now = Date.now();
      setTimeLeft(Math.max(0, Math.floor((expires - now) / 1000)));
    } catch (error) {
      toast.error('Sipariş bilgisi alınamadı');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    checkOrder();

    // Poll every 3 seconds for pending orders
    const interval = setInterval(() => {
      if (order?.status === 'pending') {
        checkOrder();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [checkOrder, order?.status]);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCopy = () => {
    if (order?.smsCode) {
      navigator.clipboard.writeText(order.smsCode);
      setIsCopied(true);
      toast.success('Kod kopyalandı!');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleFinish = async () => {
    if (!order) return;

    try {
      await orderService.finishOrder(order.id);
      toast.success('Sipariş tamamlandı');
      setOrder({ ...order, status: 'finished' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'İşlem başarısız');
    }
  };

  const handleCancel = async () => {
    if (!order) return;

    try {
      await orderService.cancelOrder(order.id);
      toast.success('Sipariş iptal edildi, bakiye iade edildi');
      updateBalance((user?.balance || 0) + order.sellPrice);
      setOrder({ ...order, status: 'canceled' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'İşlem başarısız');
    }
  };

  const handleBan = async () => {
    if (!order) return;

    try {
      await orderService.banOrder(order.id);
      toast.success('Numara banlandı, bakiye iade edildi');
      updateBalance((user?.balance || 0) + order.sellPrice);
      setOrder({ ...order, status: 'banned' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'İşlem başarısız');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Sipariş bulunamadı</p>
        <Button onClick={() => navigate('/orders')} variant="ghost" className="mt-4">
          Siparişlere Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <StatusBadge status={order.status} />
            {order.status === 'pending' && (
              <span className="text-sm text-gray-500">
                <Clock className="w-4 h-4 inline mr-1" />
                {formatTime(timeLeft)}
              </span>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-500">Numara</p>
            <p className="text-2xl font-mono font-bold">{order.phone}</p>
          </div>

          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <span>{order.product}</span>
            <span>-</span>
            <span>{order.country}</span>
          </div>
        </div>
      </Card>

      {/* SMS Code */}
      {order.smsCode && (
        <Card className="bg-green-50 border-green-200">
          <div className="text-center space-y-4">
            <p className="text-sm text-green-700 font-medium">SMS Geldi!</p>
            <div className="flex items-center justify-center space-x-4">
              <span className="text-4xl font-mono font-bold text-green-700">
                {order.smsCode}
              </span>
              <button
                onClick={handleCopy}
                className="p-2 bg-white rounded-lg border border-green-300 hover:bg-green-100 transition-colors"
              >
                {isCopied ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-green-600" />
                )}
              </button>
            </div>
            {order.smsText && (
              <p className="text-sm text-gray-600 bg-white p-3 rounded-lg">
                {order.smsText}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Waiting for SMS */}
      {order.status === 'pending' && (
        <Card>
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="animate-pulse flex space-x-2">
                <div className="w-3 h-3 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-3 h-3 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-3 h-3 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
            <p className="text-gray-600">SMS bekleniyor...</p>
            <p className="text-sm text-gray-500">
              Platformda bu numarayı kullanarak doğrulama yapın.
              SMS geldiğinde otomatik olarak görünecektir.
            </p>
          </div>
        </Card>
      )}

      {/* Actions */}
      {(order.status === 'pending' || order.status === 'received') && (
        <div className="flex flex-wrap gap-3 justify-center">
          {order.status === 'received' && (
            <Button onClick={handleFinish} variant="primary">
              <Check className="w-4 h-4 mr-2" />
              Tamamla
            </Button>
          )}

          {order.status === 'pending' && (
            <Button onClick={handleCancel} variant="secondary">
              <X className="w-4 h-4 mr-2" />
              İptal Et (İade Al)
            </Button>
          )}

          <Button onClick={handleBan} variant="danger">
            <Ban className="w-4 h-4 mr-2" />
            Numara Kullanılmış (Banla)
          </Button>
        </div>
      )}

      <div className="text-center">
        <Button onClick={() => navigate('/orders')} variant="ghost">
          Siparişlere Dön
        </Button>
      </div>
    </div>
  );
}
