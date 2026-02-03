import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, CardHeader, Button } from '../components/common';
import { orderService } from '../services/orderService';
import { useAuthStore } from '../store/authStore';
import { Product, Country, PriceInfo } from '../types';

export function BuyNumber() {
  const navigate = useNavigate();
  const { user, updateBalance } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedProduct && selectedCountry) {
      loadPrice();
    } else {
      setPriceInfo(null);
    }
  }, [selectedProduct, selectedCountry]);

  const loadData = async () => {
    try {
      const [productsData, countriesData] = await Promise.all([
        orderService.getProducts(),
        orderService.getCountries(),
      ]);
      setProducts(productsData);
      setCountries(countriesData);
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPrice = async () => {
    if (!selectedProduct || !selectedCountry) return;

    setIsPriceLoading(true);
    try {
      const price = await orderService.getProductPrice(
        selectedProduct.code,
        selectedCountry.code
      );
      setPriceInfo(price);
    } catch (error) {
      setPriceInfo(null);
      toast.error(error instanceof Error ? error.message : 'Fiyat alınamadı');
    } finally {
      setIsPriceLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!selectedProduct || !selectedCountry || !priceInfo) return;

    if ((user?.balance || 0) < priceInfo.price) {
      toast.error('Yetersiz bakiye');
      navigate('/deposit');
      return;
    }

    setIsBuying(true);
    try {
      const order = await orderService.createOrder(
        selectedProduct.code,
        selectedCountry.code
      );

      // Update balance
      updateBalance((user?.balance || 0) - priceInfo.price);

      toast.success('Numara alındı!');
      navigate(`/order/${order.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Satın alma başarısız');
    } finally {
      setIsBuying(false);
    }
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Numara Al</h1>
        <p className="text-gray-600">Platform ve ülke seçerek SMS numarası satın alın.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Platform Selection */}
        <Card>
          <CardHeader title="1. Platform Seçin" />
          <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className={`
                  flex items-center space-x-2 p-3 rounded-lg border-2 transition-colors text-left
                  ${selectedProduct?.id === product.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <span className="text-2xl">{product.icon}</span>
                <span className="font-medium">{product.name}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Country Selection */}
        <Card>
          <CardHeader title="2. Ülke Seçin" />
          <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {countries.map((country) => (
              <button
                key={country.id}
                onClick={() => setSelectedCountry(country)}
                className={`
                  flex items-center space-x-2 p-3 rounded-lg border-2 transition-colors text-left
                  ${selectedCountry?.id === country.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <span className="text-2xl">{country.flag}</span>
                <span className="font-medium">{country.name}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Price & Buy */}
      {selectedProduct && selectedCountry && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {selectedProduct.icon} {selectedProduct.name} - {selectedCountry.flag} {selectedCountry.name}
              </h3>
              {isPriceLoading ? (
                <p className="text-gray-500">Fiyat yükleniyor...</p>
              ) : priceInfo ? (
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-2xl font-bold text-primary-600">
                    {formatPrice(priceInfo.price)}
                  </span>
                  <span className="text-sm text-gray-500">
                    Stok: {priceInfo.quantity}
                  </span>
                </div>
              ) : (
                <p className="text-red-500">Bu kombinasyon için numara bulunamadı</p>
              )}
            </div>

            <Button
              onClick={handleBuy}
              disabled={!priceInfo || priceInfo.quantity === 0}
              isLoading={isBuying}
              size="lg"
            >
              Satın Al
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
