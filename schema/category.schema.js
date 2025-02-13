// 2. schema/productSchema.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db/db.config');

const category = sequelize.define('categories', {
    name: { type: DataTypes.STRING },
    image: { type: DataTypes.STRING },
    slug: { type: DataTypes.STRING },
    deletedAt: { type: DataTypes.DATE },
});

module.exports = category;