const express = require('express');
const { createproduct,listSellProductsPaginationUser,biglistProductsPagination, alllistProductsPagination,editproduct,listRecommandProductsPaginationUserBYSlug, deleteproduct,listProductsPaginationUserBYSlug, listCategories,adminProductBlock,listProductsPaginationUser,getproductBySlug, listProductsPagination, genderlistProductsPagination } = require('../controller/product.controller');
const { verifyAdminToken, verifyUserToken } = require('../tokenizer/token');

const router = express.Router();

router.post('/admin/product-create', verifyAdminToken, createproduct);
router.put('/admin/product-edit/:slug', verifyAdminToken, editproduct);
router.delete('/admin/product/:slug', verifyAdminToken, deleteproduct);
router.get('/admin/product-list', verifyAdminToken,listProductsPagination);
router.get('/admin/big-product-list', verifyAdminToken,biglistProductsPagination);
router.get('/admin/all-product-list', verifyAdminToken,alllistProductsPagination);
router.get('/user/product-list',listProductsPaginationUser);
router.get('/admin/product-list/:slug',verifyAdminToken, getproductBySlug);
router.put('/admin/product-block', verifyAdminToken ,adminProductBlock);
router.get('/user/product-detail/:slug',verifyUserToken,listProductsPaginationUserBYSlug);
router.get('/user/recommand-product-list',listRecommandProductsPaginationUserBYSlug); 
router.get('/user/selling-product-list',listSellProductsPaginationUser); 
router.get('/admin/gender-product-list',genderlistProductsPagination);


module.exports = router;


