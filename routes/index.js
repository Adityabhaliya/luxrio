// 8. routes/index.js
const express = require('express');
const userRoutes = require('./user.routes');
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');
const blogRoutes = require('./blog.routes');
const cartoutes = require('./cart.routes');

const router = express.Router();
router.use('/', userRoutes);
router.use('/', categoryRoutes);
router.use('/', productRoutes);
router.use('/', blogRoutes);
router.use('/', cartoutes);

module.exports = router;