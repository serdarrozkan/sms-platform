import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Card, CardHeader, Button, Input, Modal, StatusBadge } from '../../components/common';
import { adminService } from '../../services/adminService';
import { User, PaginatedResponse } from '../../types';

export function Users() {
  const [users, setUsers] = useState<PaginatedResponse<User> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceNote, setBalanceNote] = useState('');

  useEffect(() => {
    loadUsers();
  }, [page, search]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const result = await adminService.getUsers(page, search);
      setUsers(result);
    } catch (error) {
      toast.error('Kullanıcılar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (userId: number, status: string) => {
    try {
      await adminService.updateUser(userId, { status });
      toast.success('Kullanıcı güncellendi');
      loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Güncelleme başarısız');
    }
  };

  const handleAddBalance = async () => {
    if (!selectedUser) return;

    const amount = parseFloat(balanceAmount);
    if (isNaN(amount)) {
      toast.error('Geçerli bir tutar girin');
      return;
    }

    try {
      await adminService.addUserBalance(selectedUser.id, amount, balanceNote);
      toast.success('Bakiye güncellendi');
      setSelectedUser(null);
      setBalanceAmount('');
      setBalanceNote('');
      loadUsers();
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
    return new Date(date).toLocaleDateString('tr-TR');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Kullanıcılar</h1>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardHeader title="Kullanıcı Listesi" />
          <Input
            placeholder="Email ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
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
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Bakiye</th>
                    <th className="pb-3 font-medium">Rol</th>
                    <th className="pb-3 font-medium">Durum</th>
                    <th className="pb-3 font-medium">Kayıt</th>
                    <th className="pb-3 font-medium">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.data.map((user) => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="py-3">{user.id}</td>
                      <td className="py-3">{user.email}</td>
                      <td className="py-3 font-medium">{formatPrice(user.balance)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="py-3 text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                      <td className="py-3 space-x-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedUser(user)}
                        >
                          Bakiye
                        </Button>
                        {user.status === 'active' ? (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleStatusChange(user.id, 'banned')}
                          >
                            Engelle
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleStatusChange(user.id, 'active')}
                          >
                            Aktif Et
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users && users.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">Toplam {users.total} kullanıcı</p>
                <div className="flex space-x-2">
                  <Button variant="secondary" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                    Önceki
                  </Button>
                  <span className="px-3 py-1 text-sm">{page} / {users.totalPages}</span>
                  <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === users.totalPages}>
                    Sonraki
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Balance Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={`Bakiye Ekle/Çıkar - ${selectedUser?.email}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Mevcut Bakiye: {formatPrice(selectedUser?.balance || 0)}
          </p>
          <Input
            type="number"
            label="Tutar (Negatif değer bakiyeden düşer)"
            value={balanceAmount}
            onChange={(e) => setBalanceAmount(e.target.value)}
            placeholder="Örn: 100 veya -50"
          />
          <Input
            label="Not (Opsiyonel)"
            value={balanceNote}
            onChange={(e) => setBalanceNote(e.target.value)}
            placeholder="İşlem açıklaması"
          />
          <div className="flex space-x-2">
            <Button onClick={handleAddBalance} className="flex-1">
              Uygula
            </Button>
            <Button variant="secondary" onClick={() => setSelectedUser(null)}>
              İptal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
