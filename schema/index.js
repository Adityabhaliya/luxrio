// 3. schema/index.js
const User = require('./user.schema');
const Product = require('./product.schema');
const Otp = require('./user.otp.schema');
const category = require('./category.schema');
const cart = require('./cart.schema');
const Wishlist = require('./wish.schema');
const Setting = require('./setting.schema');
const Address = require('./address.schema');
const Size = require('./sizes.schema');

module.exports = { User, Product, Otp,Address, category ,cart ,Wishlist ,Setting , Size};