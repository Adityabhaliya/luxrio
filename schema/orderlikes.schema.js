 

// 2. schema/productSchema.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db/db.config');

const orderlikes = sequelize.define('orderlikes', {
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    order_id: { type: DataTypes.INTEGER, allowNull: false },  
    is_like: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_unlike: { type: DataTypes.BOOLEAN, defaultValue: false } 
}, {
    timestamps: true,
    paranoid: true,
});

module.exports = orderlikes;

