// backend/src/models/boosterModel.js
module.exports = (sequelize, DataTypes) =>
  sequelize.define('Booster', {
    stakeId:   { type: DataTypes.BIGINT, allowNull:false, unique:true, field:'stake_id' },
    tier:      { type: DataTypes.INTEGER, allowNull:false }, // 1,2,3
    bonusPct:  { type: DataTypes.DECIMAL(5,2), allowNull:false }, // 1.0,1.5,2.0
    grantedAt: { type: DataTypes.DATE, allowNull:false }
  },{
    tableName:'boosters',
    underscored:true,
    timestamps:false
  });
