// schema/aboutUsSchema.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db/db.config');

const AboutUs = sequelize.define('about_us', {
    description: { type: DataTypes.TEXT, allowNull: true },
    mobileno: { type: DataTypes.STRING, allowNull: true },
    right_image: { type: DataTypes.STRING, allowNull: true },
    left_image: { type: DataTypes.STRING, allowNull: true },
}, {
    timestamps: true,
    paranoid: true,
});

module.exports = AboutUs;
