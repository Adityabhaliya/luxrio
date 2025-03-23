
// 2. schema/productSchema.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db/db.config');

const home_settings = sequelize.define('home_settings', {
    key: { type: DataTypes.STRING, allowNull: true },
    value: { type: DataTypes.JSON, allowNull: true },

}, {
    timestamps: true,
    paranoid: true,
});

module.exports = home_settings;

