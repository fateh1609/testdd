// backend/src/models/lendingModel.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Lending', {
    userId:     { type: DataTypes.BIGINT, allowNull:false, field:'user_id' },
    stakeId:    { type: DataTypes.BIGINT, allowNull:false, field:'stake_id' },
    amountUsd:  { type: DataTypes.DECIMAL(24,6), allowNull:false, field:'amount_usd' },
    amountPrada:{ type: DataTypes.DECIMAL(24,6), allowNull:false, field:'amount_prada' },
    startedAt:  { type: DataTypes.DATE, allowNull:false, field:'started_at' },
    graceEnds:  { type: DataTypes.DATE, allowNull:false, field:'grace_ends' },
    dueAt:      { type: DataTypes.DATE, allowNull:false, field:'due_at' },
    status:     { type: DataTypes.ENUM('active','repaid','default'), defaultValue:'active' }
  },{
    tableName:'lendings',
    underscored:true,
    timestamps:true
  });
