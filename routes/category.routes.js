 const express = require('express');
const { createCategory, editCategory, updateContactSettings ,deleteCategory, listCategories,listCategoriesUser,adminCategoryBlock, getCategoryBySlug, listCategoriesPagination, getSettings, updateSettings, getSettings1 } = require('../controller/category.controller');
const { verifyAdminToken, verifyUserToken } = require('../tokenizer/token');

const router = express.Router();

router.post('/admin/category-create', verifyAdminToken, createCategory);
router.put('/admin/category-edit/:slug', verifyAdminToken, editCategory);
router.delete('/admin/category/:slug', verifyAdminToken, deleteCategory);
router.get('/admin/category-list', listCategories); 
router.get('/user/category-list',listCategoriesUser); 
router.get('/admin/category-list-page', listCategoriesPagination);
router.get('/admin/category-list/:slug', getCategoryBySlug);
router.put('/admin/category-block', verifyAdminToken ,adminCategoryBlock);
router.post('/admin/setting', verifyAdminToken ,updateSettings); 
router.post('/admin/contact-us', verifyAdminToken ,updateContactSettings);
router.get('/admin/setting-list', verifyAdminToken ,getSettings);
router.get('/user/setting-list' ,getSettings1);


module.exports = router;

