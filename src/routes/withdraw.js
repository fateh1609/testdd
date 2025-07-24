const express             = require('express');
const { authMiddleware }  = require('../middleware/auth');
const withdrawCtrl        = require('../controllers/withdrawController');

const router = express.Router();

router.post('/', authMiddleware, withdrawCtrl.requestWithdrawal);

module.exports = router;
