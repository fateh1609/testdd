// backend/src/controllers/dashboardController.js
const dayjs = require('dayjs');
const {
  Wallet, Stake, Booster, Lending, Rank, User
} = require('../models');
const referralService = require('../services/referralService');   // already exists

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;          // set by authMiddleware

    /* ───── Wallet ───── */
    const wallet = await Wallet.findByPk(userId);

    /* ───── Stakes (+ booster) ───── */
    const stakesRaw = await Stake.findAll({
      where: { userId, active: true },
      include: [{ model: Booster }]
    });

    const stakes = stakesRaw.map(s => ({
      id:            s.id,
      plan:          s.planCode,
      usd:           s.amountUsd,
      roiPct:        Number(s.baseMonthlyRoi).toFixed(2),
      booster:       s.Booster ? { tier:s.Booster.tier, bonusPct:s.Booster.bonusPct } : null,
      start:         s.startDate,
      lockEnds:      s.lockEnds,
      paidOutTotal:  s.paidOutTotal,
      daysLeft:      Math.max(0, dayjs(s.lockEnds).diff(dayjs(), 'day'))
    }));

    /* ───── Lending ───── */
    const lending = await Lending.findOne({ where: { userId, status: 'active' } });

    /* ───── Rank snapshot ───── */
    const teamVolume = await referralService.teamVolumeUsd(userId);  // 40:60 aware
    const ranks = await Rank.findAll({ order: [['volumeReqUsd','ASC']] });

    let currentRank = ranks[0], nextRank = null;
    for (const r of ranks) {
      if (teamVolume >= r.volumeReqUsd) currentRank = r;
      else { nextRank = r; break; }
    }

    /* ───── Down‑line counts ───── */
    const directs = await User.count({ where:{ sponsorCode: req.user.username } });
    const total   = await referralService.downlineCount(userId);

    /* ───── Response ───── */
    res.json({
      wallet: {
        available: {
          roi:    wallet.availableRoi,
          direct: wallet.availableDirect,
          diff:   wallet.availableDiff,
          rank:   wallet.availableRank
        },
        frozen: {
          roi:    wallet.frozenRoi,
          direct: wallet.frozenDirect,
          diff:   wallet.frozenDiff,
          rank:   wallet.frozenRank
        },
        totalEarned: wallet.totalEarned
      },
      stakes,
      lending: lending ? {
        amountUsd:   lending.amountUsd,
        status:      lending.status,
        graceEnds:   lending.graceEnds,
        dueAt:       lending.dueAt
      } : null,
      rank: {
        name:       currentRank.name,
        diffPct:    currentRank.diffPct,
        teamVolume,
        toNextRank: nextRank ? nextRank.volumeReqUsd - teamVolume : 0
      },
      downline: { directs, total }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Dashboard fetch failed' });
  }
};
