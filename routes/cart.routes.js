const express = require('express');
const { verifyAdminToken, verifyUserToken } = require('../tokenizer/token');
const { addToCart, editCart, listCart, deleteCartItem, updateTermCondition, getTermCondition, updatePrivacyPolicy, getPrivacyPolicy, createOrUpdateAboutUs, getAboutUs } = require('../controller/cart.controller');

const router = express.Router();


router.post('/user/cart-create', verifyUserToken, addToCart);
router.put('/user/cart-edit/:id', verifyUserToken, editCart);
router.get('/user/cart-list', verifyUserToken, listCart); 
router.get('/admin/cart-list', verifyAdminToken, listCart); 
router.delete('/user/cart-delete/:id', verifyUserToken, deleteCartItem);
router.get('/admin/privacy-policy', verifyAdminToken, getPrivacyPolicy);
router.put('/admin/privacy-policy', verifyAdminToken, updatePrivacyPolicy);
router.get('/admin/term-condition', verifyAdminToken, getTermCondition);
router.put('/admin/term-condition', verifyAdminToken, updateTermCondition);
router.get('/admin/about-us', verifyAdminToken, getAboutUs);
router.post('/admin/about-us', verifyAdminToken, createOrUpdateAboutUs);


module.exports = router;

