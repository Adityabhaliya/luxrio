const { DataTypes } = require('sequelize');
const sequelize = require('../db/db.config');

const Size = sequelize.define('sizes', {
    category_id: { type: DataTypes.INTEGER, allowNull: false },
    size: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.FLOAT, allowNull: false },
    international_price: { type: DataTypes.FLOAT, allowNull: false }
}, {
    timestamps: true,
    paranoid: true,
});

module.exports = Size;
