# SMS Doğrulama Platformu - Proje Spesifikasyonu

## 1. Proje Özeti

5sim.net API'sini kullanarak SMS doğrulama hizmeti sunan bir web platformu.

### Hedef Kitle
- SMS doğrulama ihtiyacı olan bireysel kullanıcılar

### Desteklenen Platformlar
- Instagram
- Microsoft
- Apple
- Telegram
- Facebook
- WhatsApp
- Twitter/X
- Google
- TikTok
- Discord

---

## 2. Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS |
| Backend | Node.js + Express |
| Database | MySQL |
| ORM | Prisma |
| Auth | JWT + bcrypt |
| API Provider | 5sim.net |
| Deployment | VPS |

---

## 3. Temel Özellikler

### 3.1 Kullanıcı Paneli

#### Kayıt & Giriş
- Email + Şifre ile kayıt
- Email doğrulama (opsiyonel)
- Şifremi unuttum
- JWT tabanlı oturum yönetimi

#### Dashboard
- Mevcut bakiye gösterimi
- Son siparişler özeti
- Hızlı numara satın alma

#### Numara Satın Alma
- Platform seçimi (Instagram, Apple, Microsoft vb.)
- Ülke seçimi (admin tarafından aktif edilenler)
- Operatör seçimi (any veya spesifik)
- Fiyat gösterimi
- Tek tıkla satın alma

#### SMS Bekleme Ekranı
- Gerçek zamanlı SMS takibi (polling)
- Kalan süre göstergesi
- Gelen SMS kodu gösterimi
- Kopyala butonu
- İptal et / Tamamla butonları

#### Sipariş Geçmişi
- Tüm geçmiş siparişler
- Filtreleme (tarih, platform, durum)
- Detay görüntüleme

#### Bakiye
- Mevcut bakiye
- Bakiye geçmişi (yükleme/harcama)
- Bakiye yükleme talebi oluşturma

### 3.2 Admin Paneli

#### Dashboard
- Toplam kullanıcı sayısı
- Günlük/haftalık/aylık satış istatistikleri
- 5sim.net bakiye durumu
- Son işlemler

#### Kullanıcı Yönetimi
- Kullanıcı listesi
- Kullanıcı detayı görüntüleme
- Bakiye ekleme/çıkarma
- Kullanıcı engelleme/aktifleştirme
- Sipariş geçmişi görüntüleme

#### Platform/Servis Yönetimi
- Desteklenen platformları aç/kapat
- Platform bazlı kâr marjı belirleme
- Platform görsel/isim düzenleme

#### Ülke Yönetimi
- Desteklenen ülkeleri aç/kapat
- Ülke bazlı ek kâr marjı (opsiyonel)
- Ülke bayrak/isim düzenleme

#### Fiyatlandırma
- Genel kâr marjı (%)
- Platform bazlı özel marj
- Minimum satış fiyatı

#### Bakiye Talepleri
- Bekleyen talepler listesi
- Talep onaylama/reddetme
- Manuel not ekleme

#### Siparişler
- Tüm siparişler listesi
- Filtreleme ve arama
- Sipariş detayı

#### Sistem Ayarları
- 5sim API key yönetimi
- Site başlığı, logosu
- İletişim bilgileri
- Duyuru sistemi

#### Raporlar & İstatistikler
- Günlük/haftalık/aylık gelir raporu
- En çok satılan platformlar
- Kullanıcı bazlı satış raporu
- Kâr/zarar analizi

#### Log Sistemi
- Admin işlem logları
- Kullanıcı işlem logları
- API hata logları

---

## 4. Veritabanı Şeması

### Users (Kullanıcılar)
```sql
users
├── id (PK, INT, AUTO_INCREMENT)
├── email (VARCHAR(255), UNIQUE)
├── password (VARCHAR(255)) -- bcrypt hash
├── balance (DECIMAL(10,2), DEFAULT 0)
├── role (ENUM: 'user', 'admin')
├── status (ENUM: 'active', 'banned', 'pending')
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### Orders (Siparişler)
```sql
orders
├── id (PK, INT, AUTO_INCREMENT)
├── user_id (FK -> users.id)
├── fivesim_order_id (INT) -- 5sim order ID
├── phone (VARCHAR(20))
├── product (VARCHAR(50)) -- instagram, apple, etc.
├── country (VARCHAR(50))
├── operator (VARCHAR(50))
├── fivesim_price (DECIMAL(10,4)) -- 5sim'den alınan fiyat
├── sell_price (DECIMAL(10,4)) -- Kullanıcıya satılan fiyat
├── profit (DECIMAL(10,4)) -- Kâr
├── status (ENUM: 'pending', 'received', 'finished', 'canceled', 'banned', 'timeout')
├── sms_code (VARCHAR(20)) -- Gelen SMS kodu
├── sms_text (TEXT) -- Tam SMS metni
├── expires_at (TIMESTAMP)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### Balance Transactions (Bakiye İşlemleri)
```sql
balance_transactions
├── id (PK, INT, AUTO_INCREMENT)
├── user_id (FK -> users.id)
├── type (ENUM: 'deposit', 'withdraw', 'purchase', 'refund', 'admin_add', 'admin_remove')
├── amount (DECIMAL(10,2))
├── balance_before (DECIMAL(10,2))
├── balance_after (DECIMAL(10,2))
├── description (VARCHAR(255))
├── reference_id (INT) -- order_id veya deposit_request_id
├── admin_id (FK -> users.id, NULL) -- Admin işlemi ise
├── created_at (TIMESTAMP)
```

### Deposit Requests (Bakiye Yükleme Talepleri)
```sql
deposit_requests
├── id (PK, INT, AUTO_INCREMENT)
├── user_id (FK -> users.id)
├── amount (DECIMAL(10,2))
├── payment_method (VARCHAR(50)) -- 'bank_transfer', 'papara', etc.
├── payment_details (TEXT) -- JSON: işlem numarası, dekont vs.
├── status (ENUM: 'pending', 'approved', 'rejected')
├── admin_note (TEXT)
├── processed_by (FK -> users.id, NULL)
├── processed_at (TIMESTAMP, NULL)
├── created_at (TIMESTAMP)
```

### Products (Platformlar/Servisler)
```sql
products
├── id (PK, INT, AUTO_INCREMENT)
├── code (VARCHAR(50), UNIQUE) -- 5sim product code: instagram, apple, etc.
├── name (VARCHAR(100)) -- Görünen isim
├── icon (VARCHAR(255)) -- İkon URL/path
├── is_active (BOOLEAN, DEFAULT true)
├── profit_margin (DECIMAL(5,2), NULL) -- Özel kâr marjı (null ise genel marj)
├── sort_order (INT, DEFAULT 0)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### Countries (Ülkeler)
```sql
countries
├── id (PK, INT, AUTO_INCREMENT)
├── code (VARCHAR(50), UNIQUE) -- 5sim country code: russia, england, etc.
├── name (VARCHAR(100)) -- Görünen isim
├── flag (VARCHAR(10)) -- Emoji flag: 🇷🇺, 🇬🇧
├── is_active (BOOLEAN, DEFAULT true)
├── extra_margin (DECIMAL(5,2), DEFAULT 0) -- Ek kâr marjı
├── sort_order (INT, DEFAULT 0)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### Settings (Sistem Ayarları)
```sql
settings
├── id (PK, INT, AUTO_INCREMENT)
├── key (VARCHAR(100), UNIQUE)
├── value (TEXT)
├── updated_at (TIMESTAMP)
```

Örnek ayarlar:
- `fivesim_api_key`: API anahtarı
- `default_profit_margin`: Varsayılan kâr marjı (%)
- `min_deposit_amount`: Minimum bakiye yükleme tutarı
- `site_name`: Site adı
- `site_logo`: Logo URL
- `announcement`: Aktif duyuru metni

### Admin Logs (Admin İşlem Kayıtları)
```sql
admin_logs
├── id (PK, INT, AUTO_INCREMENT)
├── admin_id (FK -> users.id)
├── action (VARCHAR(100)) -- 'user_ban', 'balance_add', etc.
├── target_type (VARCHAR(50)) -- 'user', 'order', 'setting', etc.
├── target_id (INT)
├── details (JSON) -- İşlem detayları
├── ip_address (VARCHAR(45))
├── created_at (TIMESTAMP)
```

---

## 5. API Endpoints

### Auth Endpoints
```
POST   /api/auth/register        - Kullanıcı kaydı
POST   /api/auth/login           - Giriş
POST   /api/auth/logout          - Çıkış
POST   /api/auth/forgot-password - Şifre sıfırlama talebi
POST   /api/auth/reset-password  - Şifre sıfırlama
GET    /api/auth/me              - Mevcut kullanıcı bilgisi
```

### User Endpoints
```
GET    /api/user/balance         - Bakiye bilgisi
GET    /api/user/transactions    - Bakiye işlem geçmişi
POST   /api/user/deposit-request - Bakiye yükleme talebi
GET    /api/user/deposit-requests - Talep geçmişi
```

### Product Endpoints
```
GET    /api/products             - Aktif platformlar listesi
GET    /api/products/:code/prices - Platform fiyatları (ülke bazlı)
```

### Country Endpoints
```
GET    /api/countries            - Aktif ülkeler listesi
```

### Order Endpoints
```
POST   /api/orders               - Yeni sipariş oluştur
GET    /api/orders               - Sipariş geçmişi
GET    /api/orders/:id           - Sipariş detayı
GET    /api/orders/:id/check     - SMS kontrol (polling)
POST   /api/orders/:id/finish    - Siparişi tamamla
POST   /api/orders/:id/cancel    - Siparişi iptal et
POST   /api/orders/:id/ban       - Numarayı banla
```

### Admin Endpoints
```
# Dashboard
GET    /api/admin/dashboard      - Dashboard istatistikleri

# Users
GET    /api/admin/users          - Kullanıcı listesi
GET    /api/admin/users/:id      - Kullanıcı detayı
PATCH  /api/admin/users/:id      - Kullanıcı güncelle (status, role)
POST   /api/admin/users/:id/balance - Bakiye ekle/çıkar

# Orders
GET    /api/admin/orders         - Tüm siparişler
GET    /api/admin/orders/:id     - Sipariş detayı

# Deposit Requests
GET    /api/admin/deposits       - Bakiye talepleri
PATCH  /api/admin/deposits/:id   - Talep onayla/reddet

# Products
GET    /api/admin/products       - Tüm platformlar
POST   /api/admin/products       - Platform ekle
PATCH  /api/admin/products/:id   - Platform güncelle
DELETE /api/admin/products/:id   - Platform sil

# Countries
GET    /api/admin/countries      - Tüm ülkeler
POST   /api/admin/countries      - Ülke ekle
PATCH  /api/admin/countries/:id  - Ülke güncelle
DELETE /api/admin/countries/:id  - Ülke sil

# Settings
GET    /api/admin/settings       - Tüm ayarlar
PATCH  /api/admin/settings       - Ayarları güncelle

# Reports
GET    /api/admin/reports/revenue     - Gelir raporu
GET    /api/admin/reports/products    - Ürün bazlı satış
GET    /api/admin/reports/users       - Kullanıcı bazlı satış

# Logs
GET    /api/admin/logs           - Admin işlem logları

# 5sim
GET    /api/admin/fivesim/balance - 5sim bakiye kontrolü
POST   /api/admin/fivesim/sync-products - Ürünleri senkronize et
POST   /api/admin/fivesim/sync-countries - Ülkeleri senkronize et
```

---

## 6. 5sim.net API Entegrasyonu

### Kullanılacak Endpoint'ler

```javascript
// Base URL
const FIVESIM_BASE = 'https://5sim.net/v1';

// Headers
const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Accept': 'application/json'
};

// Endpoints
GET  /user/profile                           - Hesap bilgisi ve bakiye
GET  /guest/products/{country}/{operator}    - Ürün fiyatları
GET  /guest/countries                        - Ülke listesi
POST /user/buy/activation/{country}/{operator}/{product} - Numara satın al
GET  /user/check/{id}                        - Sipariş durumu kontrol
GET  /user/finish/{id}                       - Siparişi tamamla
GET  /user/cancel/{id}                       - Siparişi iptal et
GET  /user/ban/{id}                          - Numarayı banla
```

### Sipariş Akışı

```
1. Kullanıcı platform + ülke seçer
2. GET /guest/products/{country}/any ile fiyat çekilir
3. Kâr marjı eklenerek kullanıcıya gösterilir
4. Kullanıcı onaylarsa:
   - Bakiye kontrolü yapılır
   - POST /user/buy/activation ile numara alınır
   - Bakiyeden düşülür
   - Order kaydı oluşturulur
5. Polling ile GET /user/check/{id} çağrılır (3-5 sn aralık)
6. SMS gelince kullanıcıya gösterilir
7. Kullanıcı:
   - "Tamamla" → GET /user/finish/{id}
   - "İptal" → GET /user/cancel/{id} (bakiye iade)
   - "Ban" → GET /user/ban/{id} (numara zaten kullanılmış)
```

### Hata Yönetimi

```javascript
// 5sim API hata kodları
{
  "no free phones": "Müsait numara yok",
  "not enough user balance": "5sim bakiyesi yetersiz",
  "not enough rating": "Rating yetersiz (5sim hesabında)",
  "order not found": "Sipariş bulunamadı",
  "order expired": "Sipariş süresi doldu",
  "hosting order": "Bu sipariş hosting tipi",
  "order has sms": "SMS zaten alındı"
}
```

---

## 7. Dosya Yapısı

```
sms-platform/
├── client/                      # React Frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # Button, Input, Modal, etc.
│   │   │   ├── layout/          # Header, Footer, Sidebar
│   │   │   ├── auth/            # Login, Register forms
│   │   │   ├── dashboard/       # Dashboard widgets
│   │   │   ├── orders/          # Order components
│   │   │   └── admin/           # Admin components
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── BuyNumber.tsx
│   │   │   ├── OrderStatus.tsx
│   │   │   ├── OrderHistory.tsx
│   │   │   ├── Balance.tsx
│   │   │   ├── DepositRequest.tsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.tsx
│   │   │       ├── Users.tsx
│   │   │       ├── Orders.tsx
│   │   │       ├── Products.tsx
│   │   │       ├── Countries.tsx
│   │   │       ├── Deposits.tsx
│   │   │       ├── Settings.tsx
│   │   │       ├── Reports.tsx
│   │   │       └── Logs.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useBalance.ts
│   │   │   └── usePolling.ts
│   │   ├── services/
│   │   │   ├── api.ts           # Axios instance
│   │   │   ├── authService.ts
│   │   │   ├── orderService.ts
│   │   │   └── adminService.ts
│   │   ├── store/               # State management (Context/Zustand)
│   │   │   ├── AuthContext.tsx
│   │   │   └── AppContext.tsx
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── formatters.ts
│   │   │   └── validators.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── server/                      # Node.js Backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   └── env.ts
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── userController.ts
│   │   │   ├── orderController.ts
│   │   │   ├── productController.ts
│   │   │   ├── countryController.ts
│   │   │   └── adminController.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── admin.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── rateLimiter.ts
│   │   ├── models/              # Prisma models (schema.prisma)
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   ├── userRoutes.ts
│   │   │   ├── orderRoutes.ts
│   │   │   ├── productRoutes.ts
│   │   │   ├── countryRoutes.ts
│   │   │   └── adminRoutes.ts
│   │   ├── services/
│   │   │   ├── fivesimService.ts  # 5sim API wrapper
│   │   │   ├── orderService.ts
│   │   │   ├── balanceService.ts
│   │   │   └── emailService.ts
│   │   ├── utils/
│   │   │   ├── logger.ts
│   │   │   ├── helpers.ts
│   │   │   └── pricing.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── app.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts              # Başlangıç verileri
│   ├── .env.example
│   └── package.json
│
├── docker-compose.yml           # Opsiyonel
├── .gitignore
└── README.md
```

---

## 8. Güvenlik Önlemleri

### Authentication
- JWT token ile kimlik doğrulama
- Refresh token mekanizması
- Şifre bcrypt ile hashlenecek (salt rounds: 12)
- Rate limiting (login: 5 deneme/dakika)

### API Güvenliği
- CORS ayarları
- Helmet.js middleware
- Input validation (Zod/Joi)
- SQL injection koruması (Prisma ORM)
- XSS koruması

### Admin Güvenliği
- Ayrı admin middleware
- IP whitelist (opsiyonel)
- Tüm admin işlemleri loglanacak

### 5sim API Key
- Environment variable'da saklanacak
- Asla frontend'e expose edilmeyecek
- Backend üzerinden tüm API çağrıları

---

## 9. Fiyatlandırma Mantığı

```javascript
// Fiyat hesaplama
function calculateSellPrice(fivesimPrice, product, country) {
  const settings = getSettings();
  const defaultMargin = settings.default_profit_margin; // örn: 30 (%)

  // Platform özel marjı varsa kullan
  const productMargin = product.profit_margin ?? defaultMargin;

  // Ülke ek marjı
  const countryExtra = country.extra_margin ?? 0;

  // Toplam marj
  const totalMargin = productMargin + countryExtra;

  // Satış fiyatı
  const sellPrice = fivesimPrice * (1 + totalMargin / 100);

  // 2 ondalık basamağa yuvarla
  return Math.ceil(sellPrice * 100) / 100;
}

// Örnek:
// 5sim fiyatı: 0.50₺
// Varsayılan marj: %30
// Satış fiyatı: 0.50 * 1.30 = 0.65₺
```

---

## 10. Sonraki Adımlar

1. **Proje kurulumu** - React + Express boilerplate
2. **Veritabanı** - Prisma schema ve migration
3. **Auth sistemi** - Kayıt, giriş, JWT
4. **5sim entegrasyonu** - API wrapper servisi
5. **Kullanıcı paneli** - Temel sayfalar
6. **Admin paneli** - Yönetim arayüzü
7. **Test ve optimizasyon**
8. **Deployment**

---

## Kaynaklar

- [5sim.net API Docs](https://5sim.net/docs)
- [5sim API Reference](https://5sim.net/en/docs/v1)
- [5sim FAQ - API Information](https://5sim.net/faq/api-information)
