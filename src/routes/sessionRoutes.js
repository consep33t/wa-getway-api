const express = require('express');
const { getStatus, getQR, logoutSession, refreshSession, streamQR } = require('../controllers/sessionController');

const router = express.Router();

/**
 * @swagger
 * /api/session/status:
 *   get:
 *     summary: Mendapatkan status sesi WhatsApp
 *     tags: [Session]
 *     responses:
 *       200:
 *         description: Status berhasil didapatkan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 */
router.get('/status', getStatus);

/**
 * @swagger
 * /api/session/qr:
 *   get:
 *     summary: Mendapatkan QR Code (Base64)
 *     tags: [Session]
 *     responses:
 *       200:
 *         description: QR Code tersedia
 *       400:
 *         description: WhatsApp sudah terhubung
 *       404:
 *         description: QR Code belum siap
 */
router.get('/qr', getQR);

/**
 * @swagger
 * /api/session/qr-stream:
 *   get:
 *     summary: Streaming Real-Time QR & Status (Server-Sent Events)
 *     tags: [Session]
 *     responses:
 *       200:
 *         description: Koneksi SSE berhasil terbuka
 */
router.get('/qr-stream', streamQR);

/**
 * @swagger
 * /api/session:
 *   delete:
 *     summary: Logout dan menghapus sesi saat ini
 *     tags: [Session]
 *     responses:
 *       200:
 *         description: Sesi berhasil dihapus
 *       500:
 *         description: Gagal logout
 */
router.delete('/', logoutSession);

/**
 * @swagger
 * /api/session/refresh:
 *   post:
 *     summary: Merestart service koneksi WhatsApp
 *     tags: [Session]
 *     responses:
 *       200:
 *         description: Refresh diinisiasi
 */
router.post('/refresh', refreshSession);

module.exports = router;
