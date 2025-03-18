const { DataTypes } = require('sequelize');
const sequelize = require('../db/db.config');

const Address = sequelize.define('addresses', {
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    fullName: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    country: { type: DataTypes.STRING, allowNull: true },
    city: { type: DataTypes.STRING, allowNull: false },
    state: { type: DataTypes.STRING, allowNull: false },
    zip: { type: DataTypes.STRING, allowNull: false },
    countryCode: { type: DataTypes.STRING, allowNull: false },
}, {
    timestamps: true,
    paranoid: true,
});

module.exports = Address;
