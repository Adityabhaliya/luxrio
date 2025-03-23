const express = require('express');
const { verifyAdminToken, verifyUserToken } = require('../tokenizer/token');
const { addToCart, editCart, listCart, deleteCartItem } = require('../controller/cart.controller');
const { addToWishlist, removeFromWishlist, addupdatebanner1, addupdatebanner2, listHomeSettings2, listWishlist, listHomeSettings, listInstaPosts, createInstaPost, deleteInstaPost, updateInstaPost, getInstaPost, deleteFAQ, updateFAQ, createFAQ, listFAQs, listFAQsbyid } = require('../controller/wish.controller');

const router = express.Router();


router.post('/user/wish-create', verifyUserToken, addToWishlist);
router.delete('/user/wish-remove/:id', verifyUserToken, removeFromWishlist);
router.get('/user/wish-list', verifyUserToken, listWishlist);
router.post('/admin/banner', verifyAdminToken, addupdatebanner1);
router.get('/admin/banner', verifyAdminToken, listHomeSettings);
router.get('/admin/insta_posts', verifyAdminToken, listInstaPosts);
router.get('/admin/insta_posts/:id', verifyAdminToken, getInstaPost);
router.post('/admin/insta_posts', verifyAdminToken, createInstaPost);
router.put('/admin/insta_posts/:id', verifyAdminToken, updateInstaPost);
router.delete('/admin/insta_posts/:id', verifyAdminToken, deleteInstaPost);
router.get('/admin/faqs', verifyAdminToken, listFAQs);
router.get('/admin/faqs/:id', verifyAdminToken, listFAQsbyid);
router.post('/admin/faqs', verifyAdminToken, createFAQ);
router.put('/admin/faqs/:id', verifyAdminToken, updateFAQ);
router.delete('/admin/faqs/:id', verifyAdminToken, deleteFAQ);

module.exports = router;

