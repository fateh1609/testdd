// backend/src/routes/referral.js
const router            = require('express').Router();
const jwtAuth           = require('../middleware/jwtAuth');
const referralService   = require('../services/referralService');

/* GET /api/referrals/tree  → caller’s entire down‑line */
router.get('/tree', jwtAuth, async (req, res, next) => {
  try {
    const tree = await referralService.getReferralTreeByUsername(req.user.username);
    res.json(tree);
  } catch (err) { next(err); }
});

/* GET /api/referrals/upline → array of sponsor usernames upward */
router.get('/upline', jwtAuth, async (req, res, next) => {
  try {
    const chain = await referralService.getUplineByUsername(req.user.username);
    res.json(chain);
  } catch (err) { next(err); }
});

module.exports = router;
