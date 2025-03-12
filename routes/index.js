// 8. routes/index.js
const express = require('express');
const userRoutes = require('./user.routes');
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');
const blogRoutes = require('./blog.routes');
const cartoutes = require('./cart.routes');
const wishoutes = require('./wish.routes'); 
const addressoutes = require('./address.routes'); 
const sizeroutes = require('./size.routes');
const orderroutes = require('./order.routes');

const router = express.Router();
router.use('/', userRoutes);
router.use('/', categoryRoutes);
router.use('/', productRoutes);
router.use('/', blogRoutes);
router.use('/', cartoutes);
router.use('/', wishoutes);
router.use('/', addressoutes);
router.use('/', sizeroutes);
router.use('/', orderroutes);


module.exports = router;