const cron     = require('node-cron');
const { Lending, Wallet, User } = require('../models');

/* Daily @ 02:00 – wipe defaulted loans */
cron.schedule('0 2 * * *', async () => {
  const now = new Date();
  const loans = await Lending.findAll({ where:{ status:'active', dueAt:{ $lte: now } } });

  for (const loan of loans) {
    loan.status = 'defaulted';
    await loan.save();

    /* zero wallet balances */
    const wallet = await Wallet.findByPk(loan.userId);
    wallet.availableRoi   = 0;
    wallet.frozenRoi      = 0;
    wallet.availableDirect= 0;
    wallet.frozenDirect   = 0;
    wallet.availableDiff  = 0;
    wallet.frozenDiff     = 0;
    wallet.availableRank  = 0;
    wallet.frozenRank     = 0;
    await wallet.save();

    /* re‑enable withdrawals so user can stake again */
    const user = await User.findByPk(loan.userId);
    user.canWithdraw = true;
    await user.save();

    console.log(`💸 Loan default – user ${loan.userId} wiped`);
  }
});
