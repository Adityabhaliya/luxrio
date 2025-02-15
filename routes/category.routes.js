 const express = require('express');
const { createCategory, editCategory, deleteCategory, listCategories,listCategoriesUser,adminCategoryBlock, getCategoryBySlug, listCategoriesPagination } = require('../controller/category.controller');
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


module.exports = router;

