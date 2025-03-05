// 1. schema/userSchema.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db/db.config');

const Cart = sequelize.define('carts', {
    user_id: { type: DataTypes.NUMBER, allowNull: true },
    product_id: { type: DataTypes.NUMBER, allowNull: true },
    quantity: { type: DataTypes.NUMBER, allowNull: true },
    amount: { type: DataTypes.NUMBER, allowNull: true },
    size: { type: DataTypes.NUMBER, allowNull: true },
    carat: { type: DataTypes.NUMBER, allowNull: true },   
    material_type: { type: DataTypes.NUMBER, allowNull: true }, 
});

module.exports = Cart;

