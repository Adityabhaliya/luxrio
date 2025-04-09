
const { DataTypes } = require('sequelize');
const sequelize = require('../db/db.config');

const ratingSchema = sequelize.define('ratings', {
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    product_id: { type: DataTypes.INTEGER, allowNull: true }, // Store multiple product IDs as JSON array
    order_id: { type: DataTypes.INTEGER, allowNull: true }, // Store multiple product IDs as JSON array
    rate_like: { type: DataTypes.INTEGER, allowNull: true }, // Store multiple product IDs as JSON array
    rate_unlike: { type: DataTypes.INTEGER, allowNull: true }, // Store multiple product IDs as JSON array
    description: { type: DataTypes.TEXT, allowNull: true },
    rating: { type: DataTypes.FLOAT, allowNull: true }, // INR or USD
    
}, {
    timestamps: true,
 });

module.exports = ratingSchema;

