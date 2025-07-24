// backend/src/routes/adminSale.js
const express               = require('express');
const { createAdminSale }   = require('../controllers/adminSaleController');
const adminAuth             = require('../middleware/adminAuth'); // ← NEW

const router = express.Router();

/**
 * POST /api/adminSale
 * Admin‑only manual entry of a PRADA token‑sale (e.g. OTC purchases).
 * `adminAuth` ensures the caller’s JWT contains role === 'admin'.
 */
router.post('/', adminAuth, createAdminSale);

module.exports = router;
