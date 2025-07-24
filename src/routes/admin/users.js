const express             = require('express');
const { authMiddleware }  = require('../../middleware/auth');
const usersCtrl           = require('../../controllers/admin/usersController');

const router = express.Router();
router.use(authMiddleware);             // admin JWT

router.get('/',     usersCtrl.list);     // ?q=search
router.patch('/:id/toggles', usersCtrl.toggleFlags);
router.patch('/:id/resetCreds', usersCtrl.resetCreds);

module.exports = router;
