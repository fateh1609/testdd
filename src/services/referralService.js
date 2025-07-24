/**************************************************************************
 *  referralService.js
 *  ----------------------------------------------------------------------
 *  • getReferralTreeByUsername(username)
 *  • getUplineByUsername(username)
 *  • downlineCount(userId)                 ← NEW
 *  • teamVolumeUsd(userId)                 ← NEW  (simple sum version)
 **************************************************************************/

const { User, Stake } = require('../models');

/* ------------------------------------------------------------------ *
 *  Build a nested down‑line tree for the given username
 * ------------------------------------------------------------------ */
async function getReferralTreeByUsername(username) {
  const root = await User.findOne({ where: { username } });
  if (!root) throw new Error('User not found');

  async function build(node) {
    const children = await User.findAll({
      where: { sponsorCode: node.username },
      attributes: ['id', 'username', 'firstName', 'lastName']
    });
    return {
      id:        node.id,
      username:  node.username,
      firstName: node.firstName,
      lastName:  node.lastName,
      referrals: await Promise.all(children.map(build))
    };
  }
  return build(root);
}

/* ------------------------------------------------------------------ *
 *  Walk upward through sponsorCode links until root
 * ------------------------------------------------------------------ */
async function getUplineByUsername(username) {
  const chain = [];
  let cur = await User.findOne({ where: { username } });

  while (cur && cur.sponsorCode) {
    const sponsor = await User.findOne({ where: { username: cur.sponsorCode } });
    if (!sponsor) break;
    chain.push(sponsor.username);
    cur = sponsor;
  }
  return chain;      // empty [] if no upline
}

/* ------------------------------------------------------------------ *
 *  NEW: count total descendants under a user
 * ------------------------------------------------------------------ */
async function downlineCount(rootUserId) {
  const queue = [rootUserId];
  let total = 0;

  while (queue.length) {
    const id = queue.shift();
    const parent = await User.findByPk(id);
    if (!parent) continue;

    const children = await User.findAll({
      where: { sponsorCode: parent.username },
      attributes: ['id']
    });

    total += children.length;
    queue.push(...children.map(c => c.id));
  }
  return total;
}

/* ------------------------------------------------------------------ *
 *  NEW: team volume in USD (simple version without 40:60 split)
 * ------------------------------------------------------------------ */
async function teamVolumeUsd(rootUserId) {
  const { User, Stake } = require('../models');

  /* build first‑level map: username ➜ total volume of that leg */
  const root = await User.findByPk(rootUserId);
  if (!root) return 0;

  const directs = await User.findAll({ where:{ sponsorCode: root.username } });

  const legVolume = {};
  for (const leg of directs) {
    legVolume[leg.username] = await subtreeVolume(leg.id);
  }

  /* apply 40:60 rule */
  const volumes = Object.values(legVolume).sort((a,b)=>b-a);
  if (volumes.length === 0) return 0;

  const powerLeg = volumes[0];
  const others   = volumes.slice(1).reduce((a,b)=>a+b,0);

  const allowed = powerLeg * 0.4 + others * 0.6;
  return allowed;

  /* helper: DFS sum stakes */
  async function subtreeVolume(userId) {
    let sum = await Stake.sum('amountUsd', { where:{ userId, active:true } }) || 0;
    const kids = await User.findAll({ where:{ sponsorCode:(await User.findByPk(userId)).username } });
    for (const k of kids) sum += await subtreeVolume(k.id);
    return Number(sum);
  }
}


/* ------------------------------------------------------------------ */
module.exports = {
  getReferralTreeByUsername,
  getUplineByUsername,
  downlineCount,
  teamVolumeUsd
};
