const { DataTypes } = require('sequelize');
const sequelize = require('../db/db.config');

const Wishlist = sequelize.define('wishlists', {
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
}, {
    timestamps: true,
    paranoid: true,
});

module.exports = Wishlist;
