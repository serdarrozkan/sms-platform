import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Card, CardHeader, Button, Input } from '../../components/common';
import { adminService } from '../../services/adminService';

export function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fivesimBalance, setFivesimBalance] = useState<{ balance: number; rating: number } | null>(null);

  useEffect(() => {
    loadSettings();
    loadFivesimBalance();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await adminService.getSettings();
      setSettings(result);
    } catch (error) {
      toast.error('Ayarlar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFivesimBalance = async () => {
    try {
      const result = await adminService.getFivesimBalance();
      setFivesimBalance(result);
    } catch (error) {
      console.error('5sim balance error:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await adminService.updateSettings(settings);
      toast.success('Ayarlar kaydedildi');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Kaydetme başarısız');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Sistem Ayarları</h1>

      {/* 5sim Status */}
      <Card>
        <CardHeader title="5sim Durumu" />
        {fivesimBalance ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">Bakiye</p>
              <p className="text-2xl font-bold text-green-800">{formatPrice(fivesimBalance.balance)}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">Rating</p>
              <p className="text-2xl font-bold text-blue-800">{fivesimBalance.rating}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">5sim bağlantısı kurulamadı</p>
        )}
      </Card>

      {/* General Settings */}
      <Card>
        <CardHeader title="Genel Ayarlar" />
        <div className="space-y-4">
          <Input
            label="Site Adı"
            value={settings.site_name || ''}
            onChange={(e) => updateSetting('site_name', e.target.value)}
            placeholder="SMS Platform"
          />

          <Input
            type="number"
            label="Varsayılan Kâr Marjı (%)"
            value={settings.default_profit_margin || '30'}
            onChange={(e) => updateSetting('default_profit_margin', e.target.value)}
            placeholder="30"
          />

          <Input
            type="number"
            label="Minimum Bakiye Yükleme (TL)"
            value={settings.min_deposit_amount || '10'}
            onChange={(e) => updateSetting('min_deposit_amount', e.target.value)}
            placeholder="10"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duyuru (Kullanıcılara gösterilir)
            </label>
            <textarea
              value={settings.announcement || ''}
              onChange={(e) => updateSetting('announcement', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Duyuru metni..."
            />
          </div>

          <Button onClick={handleSave} isLoading={isSaving}>
            Kaydet
          </Button>
        </div>
      </Card>

      {/* Payment Info */}
      <Card>
        <CardHeader title="Ödeme Bilgileri" />
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Banka Bilgileri (Kullanıcılara gösterilir)
            </label>
            <textarea
              value={settings.bank_info || ''}
              onChange={(e) => updateSetting('bank_info', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Banka: Ziraat Bankası&#10;IBAN: TR00 0000 0000..."
            />
          </div>

          <Button onClick={handleSave} isLoading={isSaving}>
            Kaydet
          </Button>
        </div>
      </Card>
    </div>
  );
}
