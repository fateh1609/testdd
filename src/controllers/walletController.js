// backend/src/controllers/walletController.js
const { Wallet } = require('../models');

/* GET /api/wallet/summary --------------------------------------------- */
async function getSummary (req, res) {
  // create wallet row on first access
  const [wallet] = await Wallet.findOrCreate({ where: { userId: req.user.id } });

  res.json({
    roi:   { available: wallet.availableRoi, frozen: wallet.frozenRoi },
    direct:{ available: wallet.availableDirect, frozen: wallet.frozenDirect },
    diff:  { available: wallet.availableDiff, frozen: wallet.frozenDiff },
    rank:  { available: wallet.availableRank, frozen: wallet.frozenRank },
    totals:{
      available: Number(wallet.availableRoi)   + Number(wallet.availableDirect)
               + Number(wallet.availableDiff) + Number(wallet.availableRank),
      frozen:    Number(wallet.frozenRoi)      + Number(wallet.frozenDirect)
               + Number(wallet.frozenDiff)    + Number(wallet.frozenRank)
    }
  });
}

module.exports = { getSummary };
