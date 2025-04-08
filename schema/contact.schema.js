const { DataTypes } = require('sequelize');
const sequelize = require('../db/db.config');

const contacts = sequelize.define('contacts', {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.STRING, allowNull: false },
}, {
    timestamps: true,
});

module.exports = contacts;
