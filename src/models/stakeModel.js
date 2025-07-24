const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Stake',
    {
      id:           { type: DataTypes.BIGINT, primaryKey:true, autoIncrement:true },
      userId:       { type: DataTypes.BIGINT, allowNull:false, field:'user_id' },

      /* plan info */
      planCode:     { type: DataTypes.STRING(8), allowNull:false, field:'plan_code' },
      amountUsd:    { type: DataTypes.DECIMAL(24,6), allowNull:false, field:'amount_usd' },
      amountPrada:  { type: DataTypes.DECIMAL(24,6), allowNull:false, field:'amount_prada' },
      baseMonthlyRoi:{ type: DataTypes.DECIMAL(5, 2), allowNull:false, defaultValue:0, field:'base_roi_pct' },

      startDate:    { type: DataTypes.DATE, allowNull:false, field:'start_date' },
      lockEnds:     { type: DataTypes.DATE, allowNull:false, field:'lock_ends' },

      roiCap:       { type: DataTypes.DECIMAL(24,6), allowNull:false,defaultValue:0, field:'roi_cap_usd' },   // 2.5×
      totalCap:     { type: DataTypes.DECIMAL(24,6), allowNull:false,defaultValue:0, field:'total_cap_usd' }, // 4×

      paidOutRoi:   { type: DataTypes.DECIMAL(24,6), defaultValue:0, field:'paid_out_roi' },
      paidOutTotal: { type: DataTypes.DECIMAL(24,6), defaultValue:0, field:'paid_out_total' },

      active:       { type: DataTypes.BOOLEAN, defaultValue:true }
    },
    {
      tableName:'stakes',
      underscored:true,
      timestamps:true
    }
  );
