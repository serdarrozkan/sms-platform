import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, X } from 'lucide-react';
import { Card, CardHeader, Button, StatusBadge, Modal, Input } from '../../components/common';
import { adminService } from '../../services/adminService';
import { DepositRequest, PaginatedResponse } from '../../types';

type DepositWithUser = DepositRequest & { user: { id: number; email: string } };

export function Deposits() {
  const [deposits, setDeposits] = useState<PaginatedResponse<DepositWithUser> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<string>('');
  const [selectedDeposit, setSelectedDeposit] = useState<DepositWithUser | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    loadDeposits();
  }, [page, filter]);

  const loadDeposits = async () => {
    setIsLoading(true);
    try {
      const result = await adminService.getDeposits(page, filter);
      setDeposits(result);
    } catch (error) {
      toast.error('Talepler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedDeposit || !action) return;

    try {
      await adminService.updateDeposit(
        selectedDeposit.id,
        action === 'approve' ? 'approved' : 'rejected',
        adminNote
      );
      toast.success(action === 'approve' ? 'Talep onaylandı' : 'Talep reddedildi');
      setSelectedDeposit(null);
      setAction(null);
      setAdminNote('');
      loadDeposits();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'İşlem başarısız');
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
      <h1 className="text-2xl font-bold text-gray-900">Bakiye Talepleri</h1>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardHeader title="Talepler" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Tümü</option>
            <option value="pending">Bekleyen</option>
            <option value="approved">Onaylanan</option>
            <option value="rejected">Reddedilen</option>
          </select>
        </div>

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
                    <th className="pb-3 font-medium">Tutar</th>
                    <th className="pb-3 font-medium">Yöntem</th>
                    <th className="pb-3 font-medium">Detay</th>
                    <th className="pb-3 font-medium">Durum</th>
                    <th className="pb-3 font-medium">Tarih</th>
                    <th className="pb-3 font-medium">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits?.data.map((deposit) => (
                    <tr key={deposit.id} className="border-b last:border-0">
                      <td className="py-3">{deposit.id}</td>
                      <td className="py-3">{deposit.user.email}</td>
                      <td className="py-3 font-medium">{formatPrice(deposit.amount)}</td>
                      <td className="py-3">{deposit.paymentMethod}</td>
                      <td className="py-3 text-sm text-gray-500 max-w-xs truncate">
                        {deposit.paymentDetails || '-'}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={deposit.status} />
                      </td>
                      <td className="py-3 text-sm text-gray-500">{formatDate(deposit.createdAt)}</td>
                      <td className="py-3">
                        {deposit.status === 'pending' && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => {
                                setSelectedDeposit(deposit);
                                setAction('approve');
                              }}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                setSelectedDeposit(deposit);
                                setAction('reject');
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {deposits && deposits.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">Toplam {deposits.total} talep</p>
                <div className="flex space-x-2">
                  <Button variant="secondary" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                    Önceki
                  </Button>
                  <span className="px-3 py-1 text-sm">{page} / {deposits.totalPages}</span>
                  <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === deposits.totalPages}>
                    Sonraki
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Action Modal */}
      <Modal
        isOpen={!!selectedDeposit && !!action}
        onClose={() => {
          setSelectedDeposit(null);
          setAction(null);
          setAdminNote('');
        }}
        title={action === 'approve' ? 'Talebi Onayla' : 'Talebi Reddet'}
      >
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p><strong>Kullanıcı:</strong> {selectedDeposit?.user.email}</p>
            <p><strong>Tutar:</strong> {formatPrice(selectedDeposit?.amount || 0)}</p>
            <p><strong>Yöntem:</strong> {selectedDeposit?.paymentMethod}</p>
            {selectedDeposit?.paymentDetails && (
              <p><strong>Detay:</strong> {selectedDeposit.paymentDetails}</p>
            )}
          </div>

          <Input
            label="Admin Notu (Opsiyonel)"
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="İşlem notu"
          />

          <div className="flex space-x-2">
            <Button
              onClick={handleAction}
              variant={action === 'approve' ? 'primary' : 'danger'}
              className="flex-1"
            >
              {action === 'approve' ? 'Onayla' : 'Reddet'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedDeposit(null);
                setAction(null);
                setAdminNote('');
              }}
            >
              İptal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
