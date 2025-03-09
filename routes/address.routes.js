const express = require('express');
const { verifyAdminToken, verifyUserToken } = require('../tokenizer/token');
const { createAddress, deleteAddress, getAllAddresses, getAddressById, updateAddress } = require('../controller/address.controller');

const router = express.Router();

router.post('/user/address-create', verifyUserToken, createAddress);
router.put('/user/address-edit/:id', verifyUserToken, updateAddress);
router.delete('/user/address/:id', verifyUserToken, deleteAddress);
router.get('/user/address-list', verifyUserToken, getAllAddresses);
router.get('/user/address-list/:id', verifyUserToken, getAddressById);


module.exports = router;


