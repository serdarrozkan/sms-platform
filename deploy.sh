#!/bin/bash
# SMS Platform Deployment Script
# Sunucu: 31.97.153.92
# Domain: instavia.site

set -e

echo "========================================="
echo "SMS Platform Deployment Basliyor..."
echo "========================================="

# 1. Sistem guncelle ve paketleri kur
echo "[1/8] Sistem guncelleniyor ve paketler kuruluyor..."
apt update
apt install -y nginx git curl

# Node.js 18 kur
echo "[2/8] Node.js 18 kuruluyor..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# PM2 kur
npm install -g pm2

# Certbot kur
apt install -y certbot python3-certbot-nginx

# 2. Proje klasoru ve clone
echo "[3/8] Proje klonlaniyor..."
rm -rf /var/www/sms-platform
mkdir -p /var/www/sms-platform
cd /var/www/sms-platform
git clone https://github.com/serdarrozkan/sms-platform.git .

# 3. MySQL veritabani olustur
echo "[4/8] MySQL veritabani olusturuluyor..."
mysql -u root << 'MYSQL_SCRIPT'
CREATE DATABASE IF NOT EXISTS sms_platform;
CREATE USER IF NOT EXISTS 'sms_user'@'localhost' IDENTIFIED BY 'SmsP@ss2024Secure!';
GRANT ALL PRIVILEGES ON sms_platform.* TO 'sms_user'@'localhost';
FLUSH PRIVILEGES;
MYSQL_SCRIPT

# 4. Backend kurulumu
echo "[5/8] Backend kuruluyor..."
cd /var/www/sms-platform/server
npm install

# .env dosyasi olustur
cat > .env << 'EOF'
PORT=3001
NODE_ENV=production
DATABASE_URL="mysql://sms_user:SmsP@ss2024Secure!@localhost:3306/sms_platform"
JWT_SECRET=sms-platform-jwt-secret-key-2024-very-secure-random-string
JWT_EXPIRES_IN=7d
FIVESIM_API_KEY=eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE4MDE0MDY3MzQsImlhdCI6MTc2OTg3MDczNCwicmF5IjoiODIyYmJhOTdjOTQwZjg5MjE4M2QxODk2ZWU3ZWMyMDQiLCJzdWIiOjc0Nzk5M30.tsIfCju6UULnKWZDAgLHXuwTetgmugIGtbyaF1-2d1DJRw_KZT228icZsvUgAMhVY-X48ioqInd86S_NN6eJluH03cK8poJi20Vwb1RxahBL9ZgwqKe_sccTqeMUQsSV5vM4xXDJRW-z6wthYXN-iy_K7c0DlA10TJOXH5jfu83J3FYKlmW9R41VANrhWn9pxt9m53ErQahCDhpBZ6W8u8KL4Xic-hLwX6Y-0NZuoXQKClX4W4RF3eSx1gv6koE16RC_BOeaUtL74WEoYSgpsm5GzBDft85X4B2LssvKuH-AAjVzYvr6OwqQD7UMIVMokf5PvhNBafOhgQLi80ESHg
FRONTEND_URL=https://instavia.site
EOF

# Prisma
npx prisma generate
npx prisma migrate deploy || npx prisma db push --accept-data-loss
npm run db:seed || true

# Build
npm run build

# PM2 ile baslat
pm2 delete sms-backend 2>/dev/null || true
pm2 start dist/app.js --name sms-backend
pm2 save
pm2 startup systemd -u root --hp /root

# 5. Frontend build
echo "[6/8] Frontend build aliniyor..."
cd /var/www/sms-platform/client
npm install
npm run build

# 6. Nginx konfigurasyonu
echo "[7/8] Nginx ayarlaniyor..."
cat > /etc/nginx/sites-available/sms-platform << 'NGINX_CONF'
server {
    listen 80;
    server_name instavia.site www.instavia.site;

    root /var/www/sms-platform/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_CONF

ln -sf /etc/nginx/sites-available/sms-platform /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# 7. SSL Sertifikasi
echo "[8/8] SSL sertifikasi aliniyor..."
certbot --nginx -d instavia.site -d www.instavia.site --non-interactive --agree-tos -m admin@instavia.site || echo "SSL kurulumu basarisiz, domain DNS ayarlarini kontrol edin"

# Firewall
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

echo "========================================="
echo "DEPLOYMENT TAMAMLANDI!"
echo "========================================="
echo ""
echo "Site: https://instavia.site"
echo "Admin: admin@smsplatform.com / admin123"
echo ""
echo "Backend durumu: pm2 status"
echo "Backend loglari: pm2 logs sms-backend"
