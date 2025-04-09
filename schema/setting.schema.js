const { DataTypes } = require('sequelize');
const sequelize = require('../db/db.config');

const Setting = sequelize.define('settings', {
    sale_tax: { type: DataTypes.FLOAT, allowNull: true },
    international_sale_tax: { type: DataTypes.FLOAT, allowNull: true },
    shipping_charge: { type: DataTypes.FLOAT, allowNull: true },
    international_shipping_charge: { type: DataTypes.FLOAT, allowNull: true },
    stripe_key: { type: DataTypes.STRING, allowNull: true },
    privacy_policy: { type: DataTypes.STRING, allowNull: true },
    term_condition: { type: DataTypes.STRING, allowNull: true },
    stripe_secret_key: { type: DataTypes.STRING, allowNull: true },
    twitter_url: { type: DataTypes.STRING, allowNull: true },
    instagram_url: { type: DataTypes.STRING, allowNull: true },
    facebook_url: { type: DataTypes.STRING, allowNull: true },
    contactus_phone_no: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true },
}, {
    timestamps: true,
    paranoid: true,
});

module.exports = Setting;

