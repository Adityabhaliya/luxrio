const express = require('express');
const { createblog, editblog, deleteblog, listblog,adminblogBlock,listblogsPaginationUser,getblogBySlug, listblogsPagination } = require('../controller/blog.controller');
const { verifyAdminToken, verifyUserToken } = require('../tokenizer/token');

const router = express.Router();

router.post('/admin/blog-create', verifyAdminToken, createblog);
router.put('/admin/blog-edit/:slug', verifyAdminToken, editblog);
router.delete('/admin/blog/:slug', verifyAdminToken, deleteblog);
router.get('/admin/blog-list', verifyAdminToken,listblogsPagination);
router.get('/user/blog-list',listblogsPaginationUser);
router.get('/admin/blog-list/:slug',verifyAdminToken, getblogBySlug);
router.put('/admin/blog-block', verifyAdminToken ,adminblogBlock);


module.exports = router;


