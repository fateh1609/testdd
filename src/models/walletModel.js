// backend/src/models/walletModel.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  /* ── Define table ────────────────────────────────────────────── */
  const Wallet = sequelize.define(
    'Wallet',
    {
      /* use userId as PK so 1‑to‑1 with users */
      userId: { type: DataTypes.BIGINT, primaryKey: true, field: 'user_id' },

      /* ROI */
      availableRoi: { type: DataTypes.DECIMAL(24, 6), defaultValue: 0, field: 'avail_roi' },
      frozenRoi:    { type: DataTypes.DECIMAL(24, 6), defaultValue: 0, field: 'frozen_roi' },

      /* Direct bonus */
      availableDirect: { type: DataTypes.DECIMAL(24, 6), defaultValue: 0, field: 'avail_direct' },
      frozenDirect:    { type: DataTypes.DECIMAL(24, 6), defaultValue: 0, field: 'frozen_direct' },

      /* Differential */
      availableDiff: { type: DataTypes.DECIMAL(24, 6), defaultValue: 0, field: 'avail_diff' },
      frozenDiff:    { type: DataTypes.DECIMAL(24, 6), defaultValue: 0, field: 'frozen_diff' },

      /* Rank income */
      availableRank: { type: DataTypes.DECIMAL(24, 6), defaultValue: 0, field: 'avail_rank' },
      frozenRank:    { type: DataTypes.DECIMAL(24, 6), defaultValue: 0, field: 'frozen_rank' }
    },
    {
      tableName: 'wallets',
      underscored: true,
      timestamps: true
    }
  );

  /* ── Helper methods (attach before return) ───────────────────── */

  /** Credit 7.5 % direct‑referral bonus into frozenDirect */
  Wallet.prototype.creditDirect = async function (usdAmount) {
    const credit = Number(usdAmount);
    this.frozenDirect = Number(this.frozenDirect) + credit;
    await this.save();
    return credit;
  };

  /** Credit differential income (frozen) */
Wallet.prototype.creditDifferential = async function (usdAmount) {
  const credit = Number(usdAmount);
  this.frozenDiff = Number(this.frozenDiff) + credit;
  await this.save();
  return credit;
};

  /** Generic ROI credit helper (if you need it later) */
  Wallet.prototype.creditRoi = async function (usdAmount) {
    const credit = Number(usdAmount);
    this.frozenRoi = Number(this.frozenRoi) + credit;
    await this.save();
    return credit;
  };

  return Wallet;
};
