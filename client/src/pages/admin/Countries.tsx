import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardHeader, Button, Input, Modal } from '../../components/common';
import { adminService } from '../../services/adminService';
import { Country } from '../../types';

interface ExtendedCountry extends Country {
  isActive?: boolean;
  extraMargin?: number;
  sortOrder?: number;
}

export function Countries() {
  const [countries, setCountries] = useState<ExtendedCountry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<ExtendedCountry | null>(null);
  const [form, setForm] = useState({
    code: '',
    name: '',
    flag: '',
    isActive: true,
    extraMargin: '0',
    sortOrder: '0',
  });

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    setIsLoading(true);
    try {
      const result = await adminService.getCountries();
      setCountries(result as ExtendedCountry[]);
    } catch (error) {
      toast.error('Ülkeler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      code: form.code,
      name: form.name,
      flag: form.flag || null,
      isActive: form.isActive,
      extraMargin: parseFloat(form.extraMargin) || 0,
      sortOrder: parseInt(form.sortOrder) || 0,
    };

    try {
      if (editingCountry) {
        await adminService.updateCountry(editingCountry.id, data);
        toast.success('Ülke güncellendi');
      } else {
        await adminService.createCountry(data);
        toast.success('Ülke oluşturuldu');
      }
      setIsModalOpen(false);
      resetForm();
      loadCountries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'İşlem başarısız');
    }
  };

  const handleEdit = (country: ExtendedCountry) => {
    setEditingCountry(country);
    setForm({
      code: country.code,
      name: country.name,
      flag: country.flag || '',
      isActive: country.isActive ?? true,
      extraMargin: country.extraMargin?.toString() || '0',
      sortOrder: country.sortOrder?.toString() || '0',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (countryId: number) => {
    if (!confirm('Bu ülkeyi silmek istediğinize emin misiniz?')) return;

    try {
      await adminService.deleteCountry(countryId);
      toast.success('Ülke silindi');
      loadCountries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Silme başarısız');
    }
  };

  const resetForm = () => {
    setEditingCountry(null);
    setForm({
      code: '',
      name: '',
      flag: '',
      isActive: true,
      extraMargin: '0',
      sortOrder: '0',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ülkeler</h1>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Ülke
        </Button>
      </div>

      <Card>
        <CardHeader title="Ülke Listesi" />

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3 font-medium">Sıra</th>
                  <th className="pb-3 font-medium">Bayrak</th>
                  <th className="pb-3 font-medium">Kod</th>
                  <th className="pb-3 font-medium">İsim</th>
                  <th className="pb-3 font-medium">Ek Marj</th>
                  <th className="pb-3 font-medium">Durum</th>
                  <th className="pb-3 font-medium">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {countries.map((country) => (
                  <tr key={country.id} className="border-b last:border-0">
                    <td className="py-3">{country.sortOrder}</td>
                    <td className="py-3 text-2xl">{country.flag}</td>
                    <td className="py-3 font-mono">{country.code}</td>
                    <td className="py-3 font-medium">{country.name}</td>
                    <td className="py-3">{country.extraMargin ? `+%${country.extraMargin}` : '-'}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${country.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {country.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="secondary" onClick={() => handleEdit(country)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(country.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title={editingCountry ? 'Ülkeyi Düzenle' : 'Yeni Ülke'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Kod (5sim kodu)"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="russia"
            required
            disabled={!!editingCountry}
          />
          <Input
            label="İsim"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Rusya"
            required
          />
          <Input
            label="Bayrak (Emoji)"
            value={form.flag}
            onChange={(e) => setForm({ ...form, flag: e.target.value })}
            placeholder="🇷🇺"
          />
          <Input
            type="number"
            label="Ek Kâr Marjı (%)"
            value={form.extraMargin}
            onChange={(e) => setForm({ ...form, extraMargin: e.target.value })}
            placeholder="0"
          />
          <Input
            type="number"
            label="Sıralama"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
          />
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="isActive" className="text-sm">Aktif</label>
          </div>
          <div className="flex space-x-2">
            <Button type="submit" className="flex-1">
              {editingCountry ? 'Güncelle' : 'Oluştur'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>
              İptal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
