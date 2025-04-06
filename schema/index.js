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
const order_details = require('./order_details.schema');
const home_setting = require('./home_setting.schema');
const insta_post = require('./insta.schema');
const FAQ = require('./faq.schema');
const AboutUs = require('./about.schema');
const Subscriber = require('./subscriber.schema');
const IPAddress = require('./ip.schema');
const ratingSchema = require('./rating.schema');

module.exports = { home_setting, IPAddress, ratingSchema, Subscriber, AboutUs, FAQ, User, Product, insta_post, Otp, Address, category, cart, Wishlist, Setting, order_details, Size }; 