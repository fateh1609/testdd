// backend/src/routes/wallet.js
const router    = require('express').Router();
const jwtAuth   = require('../middleware/jwtAuth');
const { Wallet } = require('../models');

/* GET /api/wallet/summary  ------------------------------------------
   Returns the caller's wallet row plus computed totals.
--------------------------------------------------------------------- */
router.get('/summary', jwtAuth, async (req, res) => {
  const wallet = await Wallet.findByPk(req.user.id);
  if (!wallet) {
    // create empty wallet row on-demand
    return res.json({ totals:{}, wallet:null });
  }

  const totals = {
    available: Number(wallet.availableRoi)   + Number(wallet.availableDirect) +
               Number(wallet.availableDiff) + Number(wallet.availableRank),
    frozen:    Number(wallet.frozenRoi)   + Number(wallet.frozenDirect) +
               Number(wallet.frozenDiff) + Number(wallet.frozenRank)
  };

  res.json({ totals, wallet });
});

module.exports = router;
