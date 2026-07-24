# WA Gateway API

## Deskripsi
Proyek ini adalah API Gateway untuk WhatsApp, dikembangkan menggunakan Node.js dan `whatsapp-web.js`. Proyek ini dirancang dengan keamanan dan praktik terbaik untuk mencegah pemblokiran akun, serta memiliki manajemen antrian pesan, logger otomatis (via Winston & Discord webhook), dan pengujian otomatis menggunakan Jest.

## Fitur Utama
- **Express API Shell**: Dilengkapi keamanan tingkat dasar dengan `helmet` dan perlindungan pembatasan laju dengan `express-rate-limit`.
- **WhatsApp Web Engine**: Menggunakan library `whatsapp-web.js` dengan strategi pencegahan pemblokiran dan fitur auto-restart saat koneksi terputus.
- **Message Pipeline**: Menunda pengiriman dengan antrian pesan untuk menghindari deteksi spam (delay acak 10-20 detik).
- **Observability**: Sistem logging yang handal dengan Winston, rotasi file harian, dan integrasi webhook ke Discord.
- **Webhook**: Menangani pesan masuk dengan strategi *reply-first*.
- **Deployment & CI/CD**: Terisolasi dalam kontainer Docker dan memiliki pipeline otomatis menggunakan GitHub Actions.

## Dokumentasi Frontend & API
Panduan lengkap untuk integrasi Frontend (termasuk scan QR Real-time, Manajemen Sesi, dan pengiriman pesan) dapat dibaca di:
👉 **[Dokumentasi Integrasi Frontend API](docs/FRONTEND_INTEGRATION.md)**

## Menjalankan Proyek Secara Lokal

1. **Clone dan Install**:
   ```bash
   git clone https://github.com/consep33t/wa-getway-api.git
   cd wa-gateway-api
   npm install
   ```

2. **Jalankan Aplikasi**:
   ```bash
   npm start
   ```

3. **Scan QR Code**: Buka terminal dan pindai kode QR yang muncul menggunakan fitur "Perangkat Tertaut" di WhatsApp Anda.

## Pengujian
Jalankan pengujian unit (TDD menggunakan Jest):
```bash
npm test
```

## Teknologi yang Digunakan
- Node.js & Express
- whatsapp-web.js
- Jest & Supertest (Testing)
- Winston (Logging)
- Docker
- GitHub Actions
