import { useEffect, useState } from 'react';
import { Card, CardHeader, Button } from '../../components/common';
import { adminService } from '../../services/adminService';
import { PaginatedResponse } from '../../types';

interface AdminLog {
  id: number;
  adminId: number;
  action: string;
  targetType: string | null;
  targetId: number | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  admin: { id: number; email: string };
}

export function Logs() {
  const [logs, setLogs] = useState<PaginatedResponse<AdminLog> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadLogs();
  }, [page]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const result = await adminService.getLogs(page);
      setLogs(result);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('tr-TR');
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      user_update: 'Kullanıcı Güncelleme',
      balance_change: 'Bakiye Değişikliği',
      deposit_process: 'Talep İşleme',
      settings_update: 'Ayar Güncelleme',
    };
    return labels[action] || action;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Logları</h1>

      <Card>
        <CardHeader title="İşlem Geçmişi" />

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
                    <th className="pb-3 font-medium">Admin</th>
                    <th className="pb-3 font-medium">İşlem</th>
                    <th className="pb-3 font-medium">Hedef</th>
                    <th className="pb-3 font-medium">Detay</th>
                    <th className="pb-3 font-medium">IP</th>
                    <th className="pb-3 font-medium">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {logs?.data.map((log) => (
                    <tr key={log.id} className="border-b last:border-0">
                      <td className="py-3">{log.id}</td>
                      <td className="py-3 text-sm">{log.admin.email}</td>
                      <td className="py-3">
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                          {getActionLabel(log.action)}
                        </span>
                      </td>
                      <td className="py-3 text-sm">
                        {log.targetType ? `${log.targetType} #${log.targetId}` : '-'}
                      </td>
                      <td className="py-3 text-sm text-gray-500 max-w-xs truncate">
                        {log.details || '-'}
                      </td>
                      <td className="py-3 text-sm font-mono text-gray-500">
                        {log.ipAddress || '-'}
                      </td>
                      <td className="py-3 text-sm text-gray-500">{formatDate(log.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {logs && logs.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">Toplam {logs.total} log</p>
                <div className="flex space-x-2">
                  <Button variant="secondary" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                    Önceki
                  </Button>
                  <span className="px-3 py-1 text-sm">{page} / {logs.totalPages}</span>
                  <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === logs.totalPages}>
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
