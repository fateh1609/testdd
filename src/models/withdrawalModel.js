// backend/src/models/withdrawalModel.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Withdrawal',
    {
      id:         { type: DataTypes.BIGINT, primaryKey:true, autoIncrement:true },
      userId:     { type: DataTypes.BIGINT, allowNull:false, field:'user_id' },
      stakeId:    { type: DataTypes.BIGINT, allowNull:false, field:'stake_id' },

      amountPrada:{ type: DataTypes.DECIMAL(24,6), allowNull:false, field:'amount_prada' },
      amountUsd:  { type: DataTypes.DECIMAL(24,6), allowNull:false, field:'amount_usd' },

      status:     { type: DataTypes.ENUM('pending','completed','failed'),
                    defaultValue:'pending' },

      txHash:     { type: DataTypes.STRING, field:'tx_hash' }
    },
    { tableName:'withdrawals', underscored:true, timestamps:true }
  );
