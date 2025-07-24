// backend/src/models/rankModel.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Rank',
    {
      name:          { type: DataTypes.STRING,  primaryKey:true },
      volumeReqUsd:  { type: DataTypes.DECIMAL(24,6), allowNull:false },
      diffPct:       { type: DataTypes.DECIMAL(4,2),  allowNull:false },
      bonusAddOnPct: { type: DataTypes.DECIMAL(4,2),  allowNull:false },
      levelsPaid:    { type: DataTypes.INTEGER,       allowNull:false }
    },
    { tableName:'ranks', underscored:true, timestamps:false }
  );
