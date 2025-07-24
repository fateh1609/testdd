// backend/src/routes/stake.js
const router      = require('express').Router();
const jwtAuth     = require('../middleware/jwtAuth');
const controller  = require('../controllers/stakeController');

/* POST /api/stake/create */
router.post('/create', jwtAuth, controller.create);

module.exports = router;
