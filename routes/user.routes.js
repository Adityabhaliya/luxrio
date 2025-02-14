// 6. routes/userRoutes.js
const express = require('express');
const { registerUser, loginUser, sendOtp, adminLogin, welcome ,adminUserBlock,uploadImage,  resetPassword, forgetPassword,  adminUserDetails} = require('../controller/user.controller');
const { verifyAdminToken } = require('../tokenizer/token');

const router = express.Router();

router.get('/welcome', welcome); 
router.post('/register', registerUser);
router.post('/login', loginUser); 
router.post('/admin-login', adminLogin); 
router.post('/forgetpassword', forgetPassword);  
router.post('/reset-password', resetPassword); 
router.post('/images-upload', uploadImage);
router.get('/admin/users', verifyAdminToken ,adminUserDetails);
router.put('/admin/user-block', verifyAdminToken ,adminUserBlock);

module.exports = router;

