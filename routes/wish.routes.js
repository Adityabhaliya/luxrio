const express = require('express');
const { verifyAdminToken, verifyUserToken } = require('../tokenizer/token');
const { addToCart, editCart, listCart, deleteCartItem } = require('../controller/cart.controller');
const { addToWishlist, removeFromWishlist, listWishlist } = require('../controller/wish.controller');

const router = express.Router();


router.post('/user/wish-create', verifyUserToken, addToWishlist);
router.delete('/user/wish-remove/:id', verifyUserToken, removeFromWishlist);
router.get('/user/wish-list', verifyUserToken, listWishlist); 
 
module.exports = router;

