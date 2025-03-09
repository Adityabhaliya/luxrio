const { DataTypes } = require('sequelize');
const sequelize = require('../db/db.config');

const Setting = sequelize.define('settings', {
    sale_tax: { type: DataTypes.FLOAT, allowNull: true },
    international_sale_tax: { type: DataTypes.FLOAT, allowNull: true },
    shipping_charge: { type: DataTypes.FLOAT, allowNull: true },
    international_shipping_charge: { type: DataTypes.FLOAT, allowNull: true },
    stripe_key: { type: DataTypes.STRING, allowNull: true },
    stripe_secret_key: { type: DataTypes.STRING, allowNull: true },
}, {
    timestamps: true,
    paranoid: true,
});

module.exports = Setting;

