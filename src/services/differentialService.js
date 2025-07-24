/**
 * Differential income – only on ROI credits
 * ---------------------------------------------------------------
 * rankPct = Rank.diffPct   (6 % Initiate … 23 % Tycoon)
 * For each ROI credit :
 *    childPct = rankPct(downline)
 *    walk upline until root:
 *       diff = max( rankPct(sponsor) − childPct , 0 )
 *       credit sponsor.frozenDiff += roiUsd × diff %
 *       childPct = rankPct(sponsor)
 */
const { User, Wallet, Rank } = require('../models');

/* fetch rank % for a user */
async function getRankPct(userId) {
  const user = await User.findByPk(userId, { include: Rank });
  return user?.Rank?.diffPct ?? 6;           // default Initiate 6 %
}

/* walk up via sponsorCode */
async function getUplineChain(user) {
  const chain = [];
  let cursor = user;
  while (cursor?.sponsorCode && cursor.sponsorCode !== 'root') {
    const parent = await User.findOne({ where:{ username: cursor.sponsorCode }, include: Rank });
    if (!parent) break;
    chain.push(parent);
    cursor = parent;
  }
  return chain;
}

/* main entry ‑ called from ROI cron */
async function payDiffForRoi(userId, roiUsd) {
  const user     = await User.findByPk(userId);
  if (!user) return;

  const chain      = await getUplineChain(user);
  let   childPct   = await getRankPct(userId);

  for (const sponsor of chain) {
    const sponsorPct = sponsor.Rank?.diffPct ?? 6;
    const diffPct    = Math.max(sponsorPct - childPct, 0);
    if (diffPct > 0) {
      const [wallet] = await Wallet.findOrCreate({ where:{ userId: sponsor.id } });
      await wallet.creditDifferential(roiUsd * diffPct / 100);
    }
    childPct = sponsorPct;
  }
}

module.exports = { payDiffForRoi };
