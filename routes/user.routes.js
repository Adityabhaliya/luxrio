// 6. routes/userRoutes.js
const express = require('express');
const { registerUser, loginUser, sendOtp, adminLogin, SubscriberList ,welcome ,adminUserBlock,uploadImage,  resetPassword, forgetPassword,  adminUserDetails, UserDetails, addSubscriber, logout} = require('../controller/user.controller');
const { verifyAdminToken, verifyUserToken } = require('../tokenizer/token');

const router = express.Router();

router.get('/welcome', welcome); 
router.post('/register', registerUser);
router.post('/login', loginUser); 
router.post('/admin-login', adminLogin); 
router.post('/forgetpassword', forgetPassword);  
router.post('/reset-password', resetPassword); 
router.post('/images-upload', uploadImage);
router.get('/admin/users', verifyAdminToken ,adminUserDetails); 
router.get('/user/details', verifyUserToken ,UserDetails);
router.put('/admin/user-block', verifyAdminToken ,adminUserBlock);
router.post('/user/subscribe', addSubscriber);
router.get('/admin/subscriber-list',verifyAdminToken, SubscriberList); 
router.get('/user/logout',verifyUserToken, logout);



module.exports = router;

