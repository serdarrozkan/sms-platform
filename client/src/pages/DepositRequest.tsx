import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Card, CardHeader, Button, Input, StatusBadge } from '../components/common';
import { orderService } from '../services/orderService';
import { DepositRequest as DepositRequestType, PaginatedResponse } from '../types';

export function DepositRequest() {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requests, setRequests] = useState<PaginatedResponse<DepositRequestType> | null>(null);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const result = await orderService.getDepositRequests();
      setRequests(result);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 10) {
      toast.error('Minimum yükleme tutarı 10 TL');
      return;
    }

    setIsLoading(true);
    try {
      await orderService.createDepositRequest(amountNum, paymentMethod, paymentDetails);
      toast.success('Bakiye yükleme talebi oluşturuldu');
      setAmount('');
      setPaymentDetails('');
      loadRequests();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Talep oluşturulamadı');
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

  const paymentMethods = [
    { value: 'bank_transfer', label: 'Banka Havale/EFT' },
    { value: 'papara', label: 'Papara' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bakiye Yükle</h1>
        <p className="text-gray-600">Hesabınıza bakiye yüklemek için talep oluşturun.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Request Form */}
        <Card>
          <CardHeader title="Yeni Talep" />
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="number"
              label="Tutar (TL)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Örn: 100"
              min="10"
              step="0.01"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ödeme Yöntemi
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {paymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                İşlem Detayları
              </label>
              <textarea
                value={paymentDetails}
                onChange={(e) => setPaymentDetails(e.target.value)}
                placeholder="İşlem numarası, dekont bilgisi vb."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Talep Oluştur
            </Button>
          </form>

          {/* Payment Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Ödeme Bilgileri</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Banka:</strong> Ziraat Bankası</p>
              <p><strong>IBAN:</strong> TR00 0000 0000 0000 0000 0000 00</p>
              <p><strong>Alıcı:</strong> SMS Platform</p>
              <p className="mt-2 text-xs">
                * Ödeme yaparken açıklama kısmına email adresinizi yazın.
              </p>
            </div>
          </div>
        </Card>

        {/* Request History */}
        <Card>
          <CardHeader title="Talep Geçmişi" />

          {isLoadingRequests ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : !requests || requests.data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Henüz talep yok</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.data.map((request) => (
                <div
                  key={request.id}
                  className="p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{formatPrice(request.amount)}</span>
                    <StatusBadge status={request.status} />
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>{request.paymentMethod === 'bank_transfer' ? 'Banka Havale' : 'Papara'}</p>
                    <p>{formatDate(request.createdAt)}</p>
                    {request.adminNote && (
                      <p className="mt-1 text-red-600">Not: {request.adminNote}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
