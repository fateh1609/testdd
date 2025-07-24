/* stakeController.js – excerpt */
const { User, Wallet, Stake } = require('../models');
const rankService = require('../services/rankService');

exports.create = async (req, res) => {
  try {
    const { planCode, amountUsd, amountPrada, baseMonthlyRoi, lockEnds } = req.body;
    const userId = req.user.id;

    /* 1) create Stake row */
    const stake = await Stake.create({
      userId, planCode, amountUsd, amountPrada, baseMonthlyRoi,
      startDate: new Date(),
      lockEnds,
      roiCap:  amountUsd * 2.5,
      totalCap: amountUsd * 4,
      active: true
    });

    /* 2) immediate DIRECT bonus (7.5 %) */
    const sponsor = await User.findOne({ where:{ username:req.user.sponsorCode } });
    if (sponsor) {
      const [ w ] = await Wallet.findOrCreate({ where:{ userId:sponsor.id } });
      await w.creditDirect(amountUsd * 0.075);
    }

    /* 3) update sponsor’s rank (volume change) */
    if (sponsor) await rankService.updateRank(sponsor.id);

    /* 4) done */
    res.json({ stake });
  } catch (err) {
    console.error('Create stake error:', err);
    res.status(500).json({ message:'Stake creation failed' });
  }
};
