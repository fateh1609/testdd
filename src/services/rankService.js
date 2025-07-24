// backend/src/services/rankService.js
const { User, Rank, RankHistory, Stake } = require('../models');
const { Op, fn, col } = require('sequelize');

/* helper: calculate team volume (power‑leg 40/60) */
async function calcTeamVolumeUsd(userId) {
  // own stakes usd
  const own = await Stake.sum('amountUsd', { where:{ userId, active:true } }) || 0;

  // children volume
  const children = await User.findAll({ where:{ sponsorCode: { [Op.eq]: fn('lower', col('username')) } } });
  const vols = [];
  for (const ch of children) {
    const sum = await Stake.sum('amountUsd', { where:{ userId: ch.id, active:true } }) || 0;
    vols.push(sum);
  }
  vols.sort((a,b)=>b-a);           // descending, first = power‑leg
  const power    = vols[0] || 0;
  const rest     = vols.slice(1).reduce((s,v)=>s+v,0);
  const teamVol  = power*0.4 + rest*0.6 + own;
  return { teamVol, power, rest, own };
}

/* update rank if volume threshold met */
exports.updateRank = async function (userId) {
  const user = await User.findByPk(userId);
  const ranks = await Rank.findAll({ order:[['volumeReqUsd','ASC']] });

  const { teamVol } = await calcTeamVolumeUsd(userId);
  let achieved = null;
  for (const r of ranks) {
    if (teamVol >= Number(r.volumeReqUsd)) achieved = r;
    else break;
  }
  if (!achieved || achieved.name === user.rank) return;

  user.rank = achieved.name;
  await user.save();
  await RankHistory.create({ userId, rankName:achieved.name, achievedAt:new Date() });
  console.log(`🏅  ${user.username} promoted to ${achieved.name}`);
};

/* return differential % for a user rank */
exports.getDiffPct = async function (rankName) {
  const rank = await Rank.findByPk(rankName);
  return rank ? Number(rank.diffPct) : 0;
};
