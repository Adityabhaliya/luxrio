const { DataTypes } = require('sequelize');
const sequelize = require('../db/db.config');

const blogs = sequelize.define('blogs', {
  title: { type: DataTypes.STRING },
  slug: { type: DataTypes.STRING },
  description: { type: DataTypes.STRING },
  images: { type: DataTypes.JSON },
  tags: { type: DataTypes.JSON },
  meta_title: { type: DataTypes.STRING },
  meta_description: { type: DataTypes.STRING },
  meta_keyword: { type: DataTypes.STRING },
  is_block: { type: DataTypes.BOOLEAN },


}, {
  timestamps: true,
  paranoid: true,
});

module.exports = blogs;
