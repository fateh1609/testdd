const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const dashboardCtrl      = require('../controllers/dashboardController');

const router = express.Router();

/* GET /api/dashboard  (JWT required) */
router.get('/', authMiddleware, dashboardCtrl.getDashboard);

module.exports = router;
