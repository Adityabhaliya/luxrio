// 3. schema/index.js
const User = require('./user.schema');
const Product = require('./product.schema');
const Otp = require('./user.otp.schema');
const category = require('./category.schema');
const cart = require('./cart.schema');
const Wishlist = require('./wish.schema');

module.exports = { User, Product, Otp, category ,cart ,Wishlist};