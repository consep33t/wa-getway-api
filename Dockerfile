# Gunakan image Node.js berbasis Debian/Ubuntu (Bullseye/Bookworm). 
# JANGAN gunakan Alpine karena kompilasi/menjalankan Chromium (Puppeteer) di Alpine sangat berisiko dan sering gagal.
FROM node:18-bullseye-slim

# Install dependencies yang dibutuhkan oleh Chromium/Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libnss3 \
    libgbm-dev \
    libasound2 \
    fonts-liberation \
    libappindicator3-1 \
    xdg-utils \
    chromium \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set environment variable agar Puppeteer menggunakan Chromium bawaan OS
# Ini menghemat waktu download dan mencegah isu dependensi biner
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /usr/src/app

# Copy package.json dan package-lock.json jika sudah dibuat (Fase 1)
# RUN: Pastikan Anda telah menjalankan 'npm init' sebelum melakukan docker-compose build
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy sisa source code
COPY . .

# Expose port sesuai konfigurasi isolasi
EXPOSE 3333

# Start command
CMD ["npm", "start"]
