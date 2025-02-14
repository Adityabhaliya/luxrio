const express = require('express');
const { createproduct, editproduct, deleteproduct, listCategories,adminProductBlock, getproductBySlug, listProductsPagination } = require('../controller/product.controller');
const { verifyAdminToken } = require('../tokenizer/token');

const router = express.Router();

router.post('/admin/product-create', verifyAdminToken, createproduct);
router.put('/admin/product-edit/:slug', verifyAdminToken, editproduct);
router.delete('/admin/product/:slug', verifyAdminToken, deleteproduct);
router.get('/admin/product-list', verifyAdminToken,listProductsPagination);
router.get('/admin/product-list/:slug',verifyAdminToken, getproductBySlug);
router.put('/admin/product-block', verifyAdminToken ,adminProductBlock);


module.exports = router;


