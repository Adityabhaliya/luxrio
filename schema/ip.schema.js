const { DataTypes } = require('sequelize');
const sequelize = require('../db/db.config');

const IPAddress = sequelize.define('ip_addresses', {
    ip_address: { type: DataTypes.STRING, allowNull: false, unique: true },
    country: { type: DataTypes.STRING, allowNull: true },
}, {
    timestamps: true,
    paranoid: true,
});

module.exports = IPAddress;
