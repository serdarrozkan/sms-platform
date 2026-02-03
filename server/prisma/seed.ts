import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smsplatform.com' },
    update: {},
    create: {
      email: 'admin@smsplatform.com',
      password: adminPassword,
      role: 'admin',
      status: 'active',
      balance: 0,
    },
  });
  console.log('Admin user created:', admin.email);

  // Create default products
  const products = [
    { code: 'instagram', name: 'Instagram', icon: '📷', sortOrder: 1 },
    { code: 'microsoft', name: 'Microsoft', icon: '🪟', sortOrder: 2 },
    { code: 'apple', name: 'Apple', icon: '🍎', sortOrder: 3 },
    { code: 'telegram', name: 'Telegram', icon: '✈️', sortOrder: 4 },
    { code: 'facebook', name: 'Facebook', icon: '👤', sortOrder: 5 },
    { code: 'whatsapp', name: 'WhatsApp', icon: '💬', sortOrder: 6 },
    { code: 'twitter', name: 'Twitter/X', icon: '🐦', sortOrder: 7 },
    { code: 'google', name: 'Google', icon: '🔍', sortOrder: 8 },
    { code: 'tiktok', name: 'TikTok', icon: '🎵', sortOrder: 9 },
    { code: 'discord', name: 'Discord', icon: '🎮', sortOrder: 10 },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { code: product.code },
      update: {},
      create: {
        ...product,
        isActive: true,
      },
    });
  }
  console.log('Products created:', products.length);

  // Create default countries
  const countries = [
    { code: 'russia', name: 'Rusya', flag: '🇷🇺', sortOrder: 1 },
    { code: 'england', name: 'İngiltere', flag: '🇬🇧', sortOrder: 2 },
    { code: 'usa', name: 'Amerika', flag: '🇺🇸', sortOrder: 3 },
    { code: 'ukraine', name: 'Ukrayna', flag: '🇺🇦', sortOrder: 4 },
    { code: 'netherlands', name: 'Hollanda', flag: '🇳🇱', sortOrder: 5 },
    { code: 'poland', name: 'Polonya', flag: '🇵🇱', sortOrder: 6 },
    { code: 'germany', name: 'Almanya', flag: '🇩🇪', sortOrder: 7 },
    { code: 'france', name: 'Fransa', flag: '🇫🇷', sortOrder: 8 },
    { code: 'spain', name: 'İspanya', flag: '🇪🇸', sortOrder: 9 },
    { code: 'italy', name: 'İtalya', flag: '🇮🇹', sortOrder: 10 },
    { code: 'india', name: 'Hindistan', flag: '🇮🇳', sortOrder: 11 },
    { code: 'indonesia', name: 'Endonezya', flag: '🇮🇩', sortOrder: 12 },
    { code: 'philippines', name: 'Filipinler', flag: '🇵🇭', sortOrder: 13 },
    { code: 'brazil', name: 'Brezilya', flag: '🇧🇷', sortOrder: 14 },
    { code: 'mexico', name: 'Meksika', flag: '🇲🇽', sortOrder: 15 },
  ];

  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: {},
      create: {
        ...country,
        isActive: true,
        extraMargin: 0,
      },
    });
  }
  console.log('Countries created:', countries.length);

  // Create default settings
  const settings = [
    { key: 'default_profit_margin', value: '30' },
    { key: 'min_deposit_amount', value: '10' },
    { key: 'site_name', value: 'SMS Platform' },
    { key: 'announcement', value: '' },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log('Settings created:', settings.length);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
