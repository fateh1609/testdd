// backend/cron/boosterCron.js
const cron = require('node-cron');
const { Stake } = require('../models');
const { maybeGrantBooster } = require('../services/boosterService');

cron.schedule('0 * * * *', async () => {          // every hour
  const stakes = await Stake.findAll({ where:{ active:true } });
  let granted = 0;
  for (const s of stakes) {
    if (await maybeGrantBooster(s)) granted++;
  }
  if (granted) console.log(`[Cron] Booster granted to ${granted} stake(s)`);
});

module.exports = {};
