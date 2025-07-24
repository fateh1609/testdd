// backend/src/models/userModel.js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      username:      { type: DataTypes.STRING, allowNull:false, unique:true },
      email:         { type: DataTypes.STRING, allowNull:false, unique:true },
      passwordHash:  { type: DataTypes.STRING, allowNull:false, field:'password_hash' },
      pinHash:       { type: DataTypes.STRING, allowNull:false, field:'pin_hash' },

      firstName:     { type: DataTypes.STRING, allowNull:false, field:'first_name' },
      lastName:      { type: DataTypes.STRING, allowNull:false, field:'last_name' },
      walletAddress: { type: DataTypes.STRING, allowNull:true,  field:'wallet_address' },
      sponsorCode:   { type: DataTypes.STRING, allowNull:false, field:'sponsor_code' },

      role:          { type: DataTypes.ENUM('user','admin'), defaultValue:'user' },

      /* NEW user‑flags (default = true) */
      canWithdraw:   { type: DataTypes.BOOLEAN, defaultValue:true, field:'can_withdraw' },
      canLend:       { type: DataTypes.BOOLEAN, defaultValue:true, field:'can_lend' },
      loginActive:   { type: DataTypes.BOOLEAN, defaultValue:true, field:'login_active' }
    },
    {
      tableName: 'users',
      underscored: true,
      timestamps: true
    }
  );

  User.prototype.verifyPin = function (pin) {
    return bcrypt.compare(pin, this.pinHash);
  };

  return User;
};
