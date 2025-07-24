'use strict';

require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

/* ────────── DB connection ────────── */
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    dialect:  'postgres',
    logging:  false,
    define:   { underscored: true }
  }
);

/* ────────── Model imports ────────── */
const User     = require('./userModel')(sequelize, DataTypes);
const Wallet   = require('./walletModel')(sequelize, DataTypes);
const Stake    = require('./stakeModel')(sequelize, DataTypes);
const Booster  = require('./boosterModel')(sequelize, DataTypes);
const Rank     = require('./rankModel')(sequelize, DataTypes);
const Lending  = require('./lendingModel')(sequelize, DataTypes);
const RankHistory = require('./rankHistoryModel')(sequelize, DataTypes);
const Withdrawal  = require('./withdrawalModel')(sequelize, DataTypes);

// helper modules that use direct queries
const TokenSale   = require('./tokenSaleModel');
const Transaction = require('./transaction');

/* ────────── Associations ────────── */
/* 1 : 1  — User ↔ Wallet */
User.hasOne(Wallet,  { foreignKey: 'user_id', onDelete: 'CASCADE' });
Wallet.belongsTo(User,{ foreignKey: 'user_id' });

/* 1 : N  — User ↔ Stake */
User.hasMany(Stake,  { foreignKey: 'user_id', onDelete: 'CASCADE' });
Stake.belongsTo(User,{ foreignKey: 'user_id' });

/* 1 : 1  — Stake ↔ Booster */
Stake.hasOne(Booster, { foreignKey: 'stake_id', onDelete: 'CASCADE' });
Booster.belongsTo(Stake,{ foreignKey: 'stake_id' });

/* (optional) User ↔ Booster for convenience */
User.hasMany(Booster,{ foreignKey: 'stake_id', sourceKey: 'id' });

/* 1 : N  — User ↔ Lending */
User.hasMany(Lending,{ foreignKey: 'user_id', onDelete: 'CASCADE' });
Lending.belongsTo(User,{ foreignKey: 'user_id' });

/* ────────── Export models & sequelize ────────── */
module.exports = {
  sequelize,
  Sequelize,
  User,
  Wallet,
  Stake,
  Booster,
  Rank,
  Lending,
  RankHistory,
  Withdrawal,
  TokenSale,
  Transaction
};
