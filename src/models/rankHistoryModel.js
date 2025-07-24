// backend/src/models/rankHistoryModel.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'RankHistory',
    {
      userId:    { type: DataTypes.BIGINT, allowNull:false, field:'user_id' },
      rankName:  { type: DataTypes.STRING, allowNull:false, field:'rank_name' },
      achievedAt:{ type: DataTypes.DATE,   allowNull:false, field:'achieved_at' }
    },
    { tableName:'rank_history', underscored:true, timestamps:false }
  );
