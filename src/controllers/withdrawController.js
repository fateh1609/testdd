const { Op }          = require('sequelize');
const dayjs           = require('dayjs');
const {
  Wallet, Stake, Withdrawal
} = require('../models');
const { sendPradaTokens } = require('../utils/pradaTransfer');
const lockUtil            = require('../utils/lockUnlock');

exports.requestWithdrawal = async (req, res) => {
  try {
    const user   = req.user;
    const amount = Number(req.body.amountUsd);
    const pin    = req.body.txPin;

    /* basic checks */
    if (!amount || amount <= 0) return res.status(400).json({ error:'Invalid amount' });
    if (!await user.verifyPin(pin))     return res.status(401).json({ error:'Bad PIN' });

    const wallet = await Wallet.findByPk(user.id);
    if (!user.canWithdraw)              return res.status(403).json({ error:'Withdrawals disabled' });
    if (wallet.availableRoi < amount)   return res.status(400).json({ error:'Insufficient ROI' });

    /* find an active stake with remaining cap */
    const stake = await Stake.findOne({
      where:{
        userId: user.id,
        active: true,
        paidOutTotal: { [Op.lt]: Sequelize.col('totalCap') }
      }
    });
    if (!stake) return res.status(400).json({ error:'No active stake with remaining cap' });

    /* split logic */
    const pradaPerUsd = 10;                        // 1 USD ⇒ 10 PRADA (example)
    const pradaNeeded = amount * pradaPerUsd;

    let txHash;
    const alreadyPaid = Number(stake.paidOutTotal);
    const transferCap = stake.amountUsd * 1.5;     // first 1.5 × via transfer

    if (alreadyPaid < transferCap) {
      /* we’re still in the 1.5× section – send tokens */
      const maxSend   = transferCap - alreadyPaid;
      const sendUsd   = Math.min(amount, maxSend);
      const sendPrada = sendUsd * pradaPerUsd;

      txHash = await sendPradaTokens(user.walletAddress, sendPrada.toString());
      /* lock remains unchanged */
    } else {
      /* unlock path */
      await lockUtil.unlockPrada(user.walletAddress, pradaNeeded.toString());
      txHash = 'unlock‑'+Date.now();
    }

    /* ledger updates */
    wallet.availableRoi  -= amount;
    wallet.totalEarned   += amount;
    await wallet.save();

    stake.paidOutRoi    += amount;
    stake.paidOutTotal  += amount;
    if (stake.paidOutTotal >= stake.totalCap) stake.active = false;
    await stake.save();

    await Withdrawal.create({
      userId: user.id,
      amountPrada: pradaNeeded,
      status: 'completed',
      txHash
    });

    res.json({ ok:true, txHash });
  } catch (err) {
    console.error('Withdrawal error', err);
    res.status(500).json({ error:'Withdrawal failed' });
  }
};
