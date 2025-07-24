/* Daily ROI cron – credits ROI and triggers differential */
const cron  = require('node-cron');
const dayjs = require('dayjs');

const { Stake, Wallet }        = require('../models');
const { payDiffForRoi }        = require('../services/differentialService');

/* helper – per‑stake daily ROI USD */
function calcDailyRoi(stake) {
  const days = dayjs().daysInMonth();
  return Number(stake.amountUsd) * Number(stake.baseMonthlyRoi) / 100 / days;
}

/* run every day 23:59 UTC */
cron.schedule('59 23 * * *', async () => {
  const stakes = await Stake.findAll({ where:{ active:true } });

  for (const stake of stakes) {
    const wallet = await Wallet.findByPk(stake.userId);
    const roiUsd = calcDailyRoi(stake);

    await wallet.creditRoi(stake, roiUsd);          // freezes ROI
    await payDiffForRoi(stake.userId, roiUsd);      // freezes differential
  }

  console.log('[Cron] Daily ROI + differential credited');
});

/* Monday 00:00 UTC – release frozen ROI/Direct/Diff/Rank */
cron.schedule('0 0 * * 1', async () => {
  const wallets = await Wallet.findAll();
  for (const w of wallets) {
    await w.releaseRoi?.();          // if you have such helpers
    await w.releaseDirect?.();
    await w.releaseDifferential?.();
    await w.releaseRank?.();
  }
  console.log('[Cron] Weekly release executed');
});

module.exports = {};           // nothing to export – cron registers itself
