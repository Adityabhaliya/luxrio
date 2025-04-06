const express = require('express');
const { verifyAdminToken, verifyUserToken } = require('../tokenizer/token');
const { createSize, updateSize, deleteSize, getAllSizes,editReview, getSizeById, getCategorySizeById, addReview } = require('../controller/size.controller');

const router = express.Router();

router.post('/admin/size-create', verifyAdminToken, createSize);
router.put('/admin/size-edit/:id', verifyAdminToken, updateSize);
router.delete('/admin/size/:id', verifyAdminToken, deleteSize);
router.get('/admin/size-list', verifyAdminToken, getAllSizes);
router.get('/admin/size-list/:id', verifyAdminToken, getSizeById);
router.get('/admin/category-size-list/:id', verifyAdminToken, getCategorySizeById); 
router.post('/user/add-rating', verifyUserToken, addReview);
router.post('/user/edit-rating/:id', verifyUserToken, editReview);


module.exports = router;


