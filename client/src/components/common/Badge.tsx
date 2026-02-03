import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}

// Status badge helper
export function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    pending: { label: 'Bekliyor', variant: 'warning' },
    received: { label: 'SMS Geldi', variant: 'success' },
    finished: { label: 'Tamamlandı', variant: 'success' },
    canceled: { label: 'İptal', variant: 'default' },
    banned: { label: 'Banlandı', variant: 'danger' },
    timeout: { label: 'Zaman Aşımı', variant: 'danger' },
    approved: { label: 'Onaylandı', variant: 'success' },
    rejected: { label: 'Reddedildi', variant: 'danger' },
    active: { label: 'Aktif', variant: 'success' },
  };

  const info = statusMap[status] || { label: status, variant: 'default' };

  return <Badge variant={info.variant}>{info.label}</Badge>;
}
