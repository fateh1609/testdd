// backend/src/services/boosterService.js
const dayjs = require('dayjs');
const { Stake, Booster, User } = require('../models');
const referralService = require('./referralService');   // already exists

const TIERS = [
  { tier:1, days:7,  directs:2,  volume:2500,  bonusPct:1.0 },
  { tier:2, days:15, directs:5,  volume:5000,  bonusPct:1.5 },
  { tier:3, days:30, directs:10, volume:20000, bonusPct:2.0 }
];

/* Count directs & team volume **at this moment** */
async function statsForUser(userId) {
  const directs = await User.count({ where:{ sponsorCode: (await User.findByPk(userId)).username } });
  const volume  = await referralService.teamVolumeUsd(userId);   // implement if missing
  return { directs, volume };
}

/* Evaluate a single stake; return Booster row if granted */
async function maybeGrantBooster(stake) {
  if (!stake.active) return null;
  if (await Booster.findOne({ where:{ stakeId: stake.id } })) return null; // already boosted

  const elapsed = dayjs().diff(stake.startDate, 'day');
  const { directs, volume } = await statsForUser(stake.userId);

  const tier = TIERS.find(t =>
        elapsed <= t.days  &&
        directs >= t.directs &&
        volume  >= t.volume );

  if (!tier) return null;

  /* 1) create Booster row */
  const booster = await Booster.create({
    stakeId: stake.id,
    tier: tier.tier,
    bonusPct: tier.bonusPct,
    grantedAt: new Date()
  });

  /* 2) bump stake’s ROI % going forward */
  stake.baseMonthlyRoi = Number(stake.baseMonthlyRoi) + tier.bonusPct;
  await stake.save();

  return booster;
}

module.exports = { maybeGrantBooster };
