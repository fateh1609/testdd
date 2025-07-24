// backend/src/routes/profile.js
const router    = require('express').Router();
const bcrypt    = require('bcrypt');
const jwtAuth   = require('../middleware/jwtAuth');
const { User }  = require('../models');

/* ── GET /api/profile ─────────────────────────────────────────── */
router.get('/', jwtAuth, async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: [
      'id','username','firstName','lastName',
      'email','walletAddress','sponsorCode',
      'role','can_withdraw','can_lend','login_active'
    ]
  });
  res.json(user);
});

/* ── PATCH /api/profile ── update name / password / pin ───────── */
router.patch('/', jwtAuth, async (req, res) => {
  const { fullName, password, pin } = req.body;
  const user = req.user;

  if (fullName) {
    const [first, ...rest] = fullName.trim().split(/\s+/);
    user.firstName = first;
    user.lastName  = rest.join(' ');
  }
  if (password) user.passwordHash = await bcrypt.hash(password, 10);
  if (pin)      user.pinHash      = await bcrypt.hash(pin, 10);

  await user.save();
  res.json({ message: 'Profile updated' });
});

module.exports = router;
