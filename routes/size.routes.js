const express = require('express');
const { verifyAdminToken, verifyUserToken } = require('../tokenizer/token');
const { createSize, updateSize, deleteSize, getAllSizes,editReview, getSizeById, getCategorySizeById, addReview, getReviewById, getAllReviews, getSampleRatings, getProductReview, updateRatingLikeUnlike } = require('../controller/size.controller');

const router = express.Router();

router.post('/admin/size-create', verifyAdminToken, createSize);
router.put('/admin/size-edit/:id', verifyAdminToken, updateSize);
router.delete('/admin/size/:id', verifyAdminToken, deleteSize);
router.get('/admin/size-list', verifyAdminToken, getAllSizes);
router.get('/admin/size-list/:id', verifyAdminToken, getSizeById);
router.get('/admin/category-size-list/:id', verifyAdminToken, getCategorySizeById); 
router.post('/user/add-rating', verifyUserToken, addReview);
router.post('/user/edit-rating/:id', verifyUserToken, editReview);
router.get('/user/get-rating', verifyUserToken, getAllReviews);
router.get('/user/get-rating/:id', verifyUserToken, getReviewById); 
router.get('/user/get-randomrating', verifyUserToken, getSampleRatings);
router.get('/user/get-product-review/:id', verifyUserToken, getProductReview);
router.post('/user/like-unlike',verifyUserToken, updateRatingLikeUnlike);




module.exports = router;


