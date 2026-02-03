# SMS Dogrulama Platformu

5sim.net API kullanarak SMS dogrulama hizmeti sunan web platformu.

## Teknolojiler

- **Frontend:** React 18, TypeScript, Tailwind CSS, Zustand
- **Backend:** Node.js, Express, Prisma ORM
- **Veritabani:** MySQL
- **API:** 5sim.net

## Kurulum

### 1. Gereksinimler

- Node.js 18+
- MySQL 8+
- 5sim.net hesabi ve API key

### 2. Backend Kurulumu

```bash
cd server

# Bagimliliklari yukle
npm install

# .env dosyasi olustur
cp .env.example .env

# .env dosyasini duzenle:
# - DATABASE_URL: MySQL baglanti bilgileri
# - JWT_SECRET: Guvenli bir secret key
# - FIVESIM_API_KEY: 5sim.net API anahtari

# Veritabani migration
npx prisma migrate dev --name init

# Prisma client olustur
npx prisma generate

# Baslangic verilerini yukle
npm run db:seed

# Sunucuyu baslat
npm run dev
```

### 3. Frontend Kurulumu

```bash
cd client

# Bagimliliklari yukle
npm install

# Gelistirme sunucusunu baslat
npm run dev
```

### 4. Erisim

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### 5. Varsayilan Admin Hesabi

- Email: admin@smsplatform.com
- Sifre: admin123

## Proje Yapisi

```
sms/
├── server/                 # Backend
│   ├── src/
│   │   ├── config/        # Yapilandirma
│   │   ├── controllers/   # Route handler'lar
│   │   ├── middleware/    # Auth, error handling
│   │   ├── routes/        # API route'lari
│   │   ├── services/      # Is mantigi
│   │   └── types/         # TypeScript tipleri
│   └── prisma/            # Veritabani semasi
│
├── client/                 # Frontend
│   └── src/
│       ├── components/    # React componentleri
│       ├── pages/         # Sayfa componentleri
│       ├── services/      # API servisleri
│       ├── store/         # Zustand state
│       └── types/         # TypeScript tipleri
│
└── SPECIFICATION.md       # Detayli spesifikasyon
```

## Ozellikler

### Kullanici Paneli
- Kayit / Giris
- Numara satin alma
- SMS bekleme ve gosterme
- Siparis gecmisi
- Bakiye yonetimi
- Bakiye yukleme talebi

### Admin Paneli
- Dashboard (istatistikler)
- Kullanici yonetimi
- Siparis takibi
- Bakiye talepleri onaylama
- Platform yonetimi
- Ulke yonetimi
- Sistem ayarlari
- Log takibi

## API Endpoints

Detayli API dokumantasyonu icin `SPECIFICATION.md` dosyasina bakin.

## Notlar

- 5sim.net API key'inizi `.env` dosyasinda tanimlayın
- Varsayilan kar marji %30 olarak ayarli
- Admin panelden platform/ulke aktif/pasif yapilabilir
- Bakiye yuklemeleri manuel onay gerektirir
