// 1. schema/userSchema.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db/db.config');

const User = sequelize.define('Otp', {
    email: { type: DataTypes.STRING, allowNull: true },
    otp: { type: DataTypes.STRING, allowNull: true },
});

module.exports = User;

