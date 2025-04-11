const express = require('express');
const { createCategory, editCategory, deleteCategory, listCategories,listCategoriesUser,adminCategoryBlock, getCategoryBySlug, listCategoriesPagination, getSettings, updateSettings } = require('../controller/category.controller');
const { verifyAdminToken, verifyUserToken } = require('../tokenizer/token');
const { createOrder, verifyOrder,AdmingetOrderDetailsPdf, listOrders,editOrderStatus,getOrderDetailsPdf, listOrdersAdmin } = require('../controller/order.controller');

const router = express.Router();

router.post('/user/order-create', verifyUserToken, createOrder);
router.post('/user/order-verify', verifyUserToken, verifyOrder);
router.get('/user/order-list', verifyUserToken, listOrders);
router.get('/admin/order-list', verifyAdminToken, listOrdersAdmin);
router.put('/admin/order-status', verifyAdminToken, editOrderStatus);
 
router.patch('/user/download-order-details/:order_id', verifyUserToken,getOrderDetailsPdf);
router.patch('/admin/download-order/:order_id', verifyAdminToken,AdmingetOrderDetailsPdf);


module.exports = router;

