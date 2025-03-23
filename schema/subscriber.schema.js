const { DataTypes } = require('sequelize');
const sequelize = require('../db/db.config');

const Subscriber = sequelize.define('subscribers', {
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
}, {
    timestamps: true,
    paranoid: true,
});

module.exports = Subscriber;
