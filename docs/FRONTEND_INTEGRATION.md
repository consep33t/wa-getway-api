# Dokumentasi Integrasi Frontend API WA Gateway

Dokumen ini berisi panduan lengkap untuk tim Frontend dalam melakukan integrasi dengan WA Gateway API. Semua response dari API menggunakan format JSON.

---

## 1. Cek Status Sesi
Mendapatkan status koneksi WhatsApp saat ini. Sangat berguna untuk menentukan apakah frontend harus merender halaman scan QR atau halaman dashboard.

**Endpoint:** `GET /api/session/status`

### Request
- **Headers:** Tidak ada
- **Body:** Tidak ada

### Response: Success (200 OK)
```json
{
  "status": "CONNECTED"
}
```
*Catatan: Nilai status bisa berupa `INITIALIZING`, `QR_READY`, `AUTHENTICATED`, `CONNECTED`, atau `DISCONNECTED`.*

### Response: Error (500 Internal Server Error)
```json
{
  "error": "Internal Server Error"
}
```

---

## 2. Mengambil QR Code (Sekali Tarik / Polling)
Mendapatkan QR Code dalam bentuk Base64 yang bisa langsung dimasukkan ke tag `<img src="..." />`. Endpoint ini me-return error jika WA sudah dalam keadaan terhubung.

**Endpoint:** `GET /api/session/qr`

### Request
- **Headers:** Tidak ada
- **Body:** Tidak ada

### Response: Success (200 OK)
```json
{
  "status": "success",
  "data": {
    "qr": "data:image/png;base64,iVBORw0KGgo...",
    "generatedAt": "2026-07-21T00:00:00.000Z",
    "expiresInSeconds": 20
  }
}
```

### Response: Error (400 Bad Request) - Jika sudah login
```json
{
  "error": "WhatsApp is already connected"
}
```

### Response: Error (404 Not Found) - Jika QR belum siap
```json
{
  "error": "QR code not available yet"
}
```

---

## 3. Real-Time QR & Status (Server-Sent Events) - DIREKOMENDASIKAN
Daripada melakukan polling berulang kali ke `/api/session/qr`, frontend sangat disarankan menggunakan rute ini dengan API `EventSource` bawaan browser. Backend akan otomatis nge-*push* QR terbaru setiap kali berubah.

**Endpoint:** `GET /api/session/qr-stream`

### Cara Implementasi di Frontend (JavaScript/React)
```javascript
const eventSource = new EventSource('http://localhost:3333/api/session/qr-stream');

// Mendengarkan perubahan status
eventSource.addEventListener('status', (e) => {
  const data = JSON.parse(e.data);
  console.log('Status WA:', data.status);
});

// Mendengarkan update QR Code terbaru
eventSource.addEventListener('qr', (e) => {
  const data = JSON.parse(e.data);
  console.log('Update QR Baru:', data.qr); // Masukkan ke tag <img src={data.qr} />
});
```

---

## 4. Logout & Hapus Sesi
Digunakan ketika user ingin mengganti nomor WA (logout dari sesi yang sekarang) dan meminta QR code yang baru.

**Endpoint:** `DELETE /api/session`

### Request
- **Headers:** Tidak ada
- **Body:** Tidak ada

### Response: Success (200 OK)
```json
{
  "status": "success",
  "message": "Session logged out and disconnected"
}
```

### Response: Error (500 Internal Server Error)
```json
{
  "error": "Failed to logout session"
}
```

---

## 5. Refresh / Restart Sesi
Digunakan untuk melakukan "soft restart" pada engine WhatsApp jika dirasa koneksi sedang stuck atau bermasalah tanpa menghapus sesi login.

**Endpoint:** `POST /api/session/refresh`

### Request
- **Headers:** Tidak ada
- **Body:** Tidak ada

### Response: Success (200 OK)
```json
{
  "status": "success",
  "message": "Session refresh initiated"
}
```

---

## 6. Mengirim Pesan WhatsApp (Broadcast/Send)
Memasukkan pesan ke dalam antrian pengiriman. Demi keamanan (Anti-Ban), pesan tidak langsung terkirim melainkan dimasukkan ke Queue dengan jeda acak 10-20 detik.

**Endpoint:** `POST /send-message`

### Request
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "number": "081234567890",
  "message": "Halo, ini pesan percobaan dari API"
}
```
*Catatan: Nomor bebas menggunakan format 08..., 628..., atau +628..., sistem akan memformatnya secara otomatis.*

### Response: Success (202 Accepted)
```json
{
  "status": "queued",
  "message": "Message has been added to the queue for delivery",
  "to": "6281234567890@c.us",
  "hasMedia": false
}
```

### Response: Error (400 Bad Request) - Parameter tidak lengkap
```json
{
  "error": "number and message are required"
}
```

### Response: Error (400 Bad Request) - Nomor tidak valid
```json
{
  "error": "invalid number format"
}
```
