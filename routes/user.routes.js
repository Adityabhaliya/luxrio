// 6. routes/userRoutes.js
const express = require('express');
const { registerUser, loginUser, sendOtp, adminLogin, welcome ,uploadImage} = require('../controller/user.controller');

const router = express.Router();

router.get('/welcome', welcome); 
router.post('/register', registerUser);
router.post('/login', loginUser); 
router.post('/admin-login', adminLogin); 
router.post('/sendotp', sendOtp); 
router.post('/images-upload', uploadImage);

module.exports = router;

