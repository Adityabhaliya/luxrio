// schema/faqSchema.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db/db.config');

const FAQ = sequelize.define('faqs', {
    question: { type: DataTypes.STRING, allowNull: false },
    answer: { type: DataTypes.TEXT, allowNull: false }
}, {
    timestamps: true,
    paranoid: true,
});

module.exports = FAQ;
