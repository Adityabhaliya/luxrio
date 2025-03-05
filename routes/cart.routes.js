const express = require('express');
const { verifyAdminToken, verifyUserToken } = require('../tokenizer/token');
const { addToCart, editCart, listCart, deleteCartItem } = require('../controller/cart.controller');

const router = express.Router();


router.post('/user/cart-create', verifyUserToken, addToCart);
router.put('/user/cart-edit/:id', verifyUserToken, editCart);
router.get('/user/cart-list', verifyUserToken, listCart); 
router.delete('/user/cart-delete/:id', verifyUserToken, deleteCartItem);

module.exports = router;

