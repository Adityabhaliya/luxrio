// 1. schema/userSchema.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db/db.config');

const User = sequelize.define('User', {
    name: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true },
    lastname: { type: DataTypes.STRING, allowNull: true },
    password: { type: DataTypes.STRING, allowNull: true },
    profile: { type: DataTypes.STRING, allowNull: true },
    role: { type: DataTypes.INTEGER, allowNull: false },
}); 

module.exports = User;

