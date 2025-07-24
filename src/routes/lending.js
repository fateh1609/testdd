const router       = require('express').Router();
const jwtAuth      = require('../middleware/jwtAuth');
const controller   = require('../controllers/lendingController');

/* POST /api/lend/request */
router.post('/request', jwtAuth, controller.requestLoan);

/* POST /api/lend/repay */
router.post('/repay',   jwtAuth, controller.repayLoan);

module.exports = router;
