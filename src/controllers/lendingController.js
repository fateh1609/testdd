// backend/src/controllers/lendingController.js
const dayjs          = require('dayjs');
const { Stake, Wallet, Lending, User } = require('../models');
const { unlockPrada, lockPrada } = require('../utils/pradaTransfer');

const PRADA_PER_USD  = 10;
const INTEREST_RATE  = 0.03;     // 3 % flat after grace period

/* ── POST /api/lend/request ─────────────────────────────────────── */
exports.requestLoan = async (req, res, next) => {
  try {
    const { stakeId } = req.body;
    const stake = await Stake.findOne({ where:{ id: stakeId, userId:req.user.id } });

    if (!stake || !stake.active)
      return res.status(400).json({ error:'Invalid or inactive stake' });

    /* must be within lock period */
    if (new Date() > stake.lockEnds)
      return res.status(400).json({ error:'Stake no longer in lock period' });

    /* wallet must have no available ROI / direct etc. */
    const wallet = await Wallet.findByPk(req.user.id);
    if (Number(wallet.availableRoi) > 0 ||
        Number(wallet.availableDirect) > 0 ||
        Number(wallet.availableDiff) > 0 ||
        Number(wallet.availableRank) > 0) {
      return res.status(400).json({ error:'Withdrawal balances must be zero' });
    }

    /* compute loan amount = remaining locked principal in PRADA */
    const usdAmount   = stake.amountUsd;
    const pradaAmount = usdAmount * PRADA_PER_USD;

    /* unlock tokens to user */
    await unlockPrada(req.user.walletAddress, pradaAmount);

    const now        = new Date();
    const graceEnds  = dayjs(now).add(48, 'hour').toDate();
    const dueAt      = dayjs(now).add(14, 'day').toDate();

    await Lending.create({
      userId: req.user.id,
      stakeId,
      amountUsd: usdAmount,
      amountPrada: pradaAmount,
      startedAt: now,
      graceEnds,
      dueAt
    });

    /* disable withdrawals while loan is open */
    req.user.canWithdraw = false;
    await req.user.save();

    res.json({ message:'Loan disbursed', amountUsd: usdAmount, dueAt });
  } catch (err) { next(err); }
};

/* ── POST /api/lend/repay ───────────────────────────────────────── */
exports.repayLoan = async (req, res, next) => {
  try {
    const loan = await Lending.findOne({ where:{ userId:req.user.id, status:'active' } });
    if (!loan) return res.status(400).json({ error:'No active loan' });

    /* lock back the principal */
    await lockPrada(req.user.walletAddress, loan.amountUsd);

    /* interest if past grace period */
    const now = new Date();
    let interestUsd = 0;
    if (now > loan.graceEnds) {
      interestUsd = loan.amountUsd * INTEREST_RATE;
      const wallet = await Wallet.findByPk(req.user.id);
      wallet.availableRoi = Number(wallet.availableRoi) - interestUsd;
      await wallet.save();
    }

    loan.status = 'repaid';
    await loan.save();

    /* re‑enable withdrawals */
    req.user.canWithdraw = true;
    await req.user.save();

    res.json({ message:'Loan repaid', interestUsd });
  } catch (err) { next(err); }
};
