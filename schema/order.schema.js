
// 2. schema/productSchema.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db/db.config');

const Order = sequelize.define('orders', {
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    product_ids: { type: DataTypes.JSON, allowNull: false }, // Store multiple product IDs as JSON array
    total_amount: { type: DataTypes.FLOAT, allowNull: false },
    currency: { type: DataTypes.STRING, allowNull: false, defaultValue: 'INR' }, // INR or USD
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Pending' },
    payment_id: { type: DataTypes.STRING, allowNull: true }, // Store payment gateway transaction ID
    shipping_address: { type: DataTypes.JSON, allowNull: false }, // Store address as JSON
}, {
    timestamps: true,
    paranoid: true,
});

module.exports = Order;

