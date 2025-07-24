const cron   = require('node-cron');
const dayjs  = require('dayjs');
const axios  = require('axios');
const { Lending, Stake, Wallet } = require('../models');

const SCHEDULE = process.env.LOAN_SWEEP_CRON || '0 0 * * *';     // default daily 00:00 UTC

async function sweep() {
  try {
    const overdue = await Lending.findAll({ where:{ status:'active', dueAt:{ [Op.lt]: new Date() } } });
    for (const loan of overdue) {
      await liquidate(loan);
    }
    if (overdue.length)
      console.log(`[Cron] Loan sweep closed ${overdue.length} record(s)`);
  } catch (err) {
    console.error('Loan sweep error', err);
  }
}
module.exports = () => cron.schedule(SCHEDULE, sweep, { timezone:'UTC' });

/* liquidate & alert */
async function liquidate(loan) {
  const stake  = await Stake.findByPk(loan.stakeId);
  const wallet = await Wallet.findByPk(loan.userId);

  stake.active = false;
  await stake.save();

  wallet.canWithdraw = true;          // restore flag
  await wallet.save();

  loan.status = 'closed';
  await loan.save();

  if (process.env.DEFAULT_ALERT_WEBHOOK) {
    try {
      await axios.post(process.env.DEFAULT_ALERT_WEBHOOK, {
        text: `PradaFund – loan default liquidated\nUser ${loan.userId}\nStake ${stake.id}\nUSD ${loan.amountUsd}`
      });
    } catch (e) { /* ignore */ }
  }
}
