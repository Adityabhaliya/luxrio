
const { DataTypes } = require('sequelize');
const sequelize = require('../db/db.config');

const ratingSchema = sequelize.define('ratings', {
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    product_id: { type: DataTypes.JSON, allowNull: false }, // Store multiple product IDs as JSON array
    description: { type: DataTypes.TEXT, allowNull: false },
    rating: { type: DataTypes.FLOAT, allowNull: false }, // INR or USD
    
}, {
    timestamps: true,
    paranoid: true,
});

module.exports = ratingSchema;

