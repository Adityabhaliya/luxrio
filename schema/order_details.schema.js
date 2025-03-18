
// 2. schema/productSchema.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db/db.config');

const order_details = sequelize.define('order_details', {
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    order_id: { type: DataTypes.INTEGER, allowNull: false },
    product_id: { type: DataTypes.INTEGER, allowNull: false }, // Store multiple product IDs as JSON array
    quantity: { type: DataTypes.NUMBER, allowNull: true },
    amount: { type: DataTypes.NUMBER, allowNull: true },
    size: { type: DataTypes.NUMBER, allowNull: true },
    carat: { type: DataTypes.NUMBER, allowNull: true },   
    material_type: { type: DataTypes.STRING, allowNull: true }, 
    weight: { type: DataTypes.FLOAT, allowNull: true },  
}, {
    timestamps: true,
    paranoid: true,
});

module.exports = order_details;

