import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardHeader, Button, Input, Modal } from '../../components/common';
import { adminService } from '../../services/adminService';
import { Product } from '../../types';

interface ExtendedProduct extends Product {
  isActive?: boolean;
  profitMargin?: number;
  sortOrder?: number;
}

export function Products() {
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ExtendedProduct | null>(null);
  const [form, setForm] = useState({
    code: '',
    name: '',
    icon: '',
    isActive: true,
    profitMargin: '',
    sortOrder: '0',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const result = await adminService.getProducts();
      setProducts(result as ExtendedProduct[]);
    } catch (error) {
      toast.error('Ürünler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      code: form.code,
      name: form.name,
      icon: form.icon || null,
      isActive: form.isActive,
      profitMargin: form.profitMargin ? parseFloat(form.profitMargin) : null,
      sortOrder: parseInt(form.sortOrder) || 0,
    };

    try {
      if (editingProduct) {
        await adminService.updateProduct(editingProduct.id, data);
        toast.success('Ürün güncellendi');
      } else {
        await adminService.createProduct(data);
        toast.success('Ürün oluşturuldu');
      }
      setIsModalOpen(false);
      resetForm();
      loadProducts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'İşlem başarısız');
    }
  };

  const handleEdit = (product: ExtendedProduct) => {
    setEditingProduct(product);
    setForm({
      code: product.code,
      name: product.name,
      icon: product.icon || '',
      isActive: product.isActive ?? true,
      profitMargin: product.profitMargin?.toString() || '',
      sortOrder: product.sortOrder?.toString() || '0',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (productId: number) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;

    try {
      await adminService.deleteProduct(productId);
      toast.success('Ürün silindi');
      loadProducts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Silme başarısız');
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setForm({
      code: '',
      name: '',
      icon: '',
      isActive: true,
      profitMargin: '',
      sortOrder: '0',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Platformlar</h1>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Platform
        </Button>
      </div>

      <Card>
        <CardHeader title="Platform Listesi" />

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
                  <th className="pb-3 font-medium">İkon</th>
                  <th className="pb-3 font-medium">Kod</th>
                  <th className="pb-3 font-medium">İsim</th>
                  <th className="pb-3 font-medium">Özel Marj</th>
                  <th className="pb-3 font-medium">Durum</th>
                  <th className="pb-3 font-medium">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b last:border-0">
                    <td className="py-3">{product.sortOrder}</td>
                    <td className="py-3 text-2xl">{product.icon}</td>
                    <td className="py-3 font-mono">{product.code}</td>
                    <td className="py-3 font-medium">{product.name}</td>
                    <td className="py-3">{product.profitMargin ? `%${product.profitMargin}` : 'Varsayılan'}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {product.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="secondary" onClick={() => handleEdit(product)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(product.id)}>
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
        title={editingProduct ? 'Platformu Düzenle' : 'Yeni Platform'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Kod (5sim kodu)"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="instagram"
            required
            disabled={!!editingProduct}
          />
          <Input
            label="İsim"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Instagram"
            required
          />
          <Input
            label="İkon (Emoji)"
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            placeholder="📷"
          />
          <Input
            type="number"
            label="Özel Kâr Marjı (%) - Boş bırakılırsa varsayılan"
            value={form.profitMargin}
            onChange={(e) => setForm({ ...form, profitMargin: e.target.value })}
            placeholder="30"
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
              {editingProduct ? 'Güncelle' : 'Oluştur'}
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
