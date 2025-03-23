
// 2. schema/productSchema.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db/db.config');

const insta_post = sequelize.define('insta_posts', {
    image: { type: DataTypes.STRING, allowNull: true },
    url: { type: DataTypes.STRING, allowNull: true },

}, {
    timestamps: true,
    paranoid: true,
});

module.exports = insta_post;

