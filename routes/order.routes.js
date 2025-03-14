const express = require('express');
const { createCategory, editCategory, deleteCategory, listCategories,listCategoriesUser,adminCategoryBlock, getCategoryBySlug, listCategoriesPagination, getSettings, updateSettings } = require('../controller/category.controller');
const { verifyAdminToken, verifyUserToken } = require('../tokenizer/token');
const { createOrder, verifyOrder } = require('../controller/order.controller');

const router = express.Router();

router.post('/user/order-create', verifyUserToken, createOrder);
router.post('/user/order-verify', verifyUserToken, verifyOrder);
 


module.exports = router;

