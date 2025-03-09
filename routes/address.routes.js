const express = require('express');
const { verifyAdminToken, verifyUserToken } = require('../tokenizer/token');
const { createAddress, deleteAddress, getAllAddresses, getAddressById, updateAddress } = require('../controller/address.controller');

const router = express.Router();

router.post('/admin/address-create', verifyUserToken, createAddress);
router.put('/admin/address-edit/:id', verifyUserToken, updateAddress);
router.delete('/admin/address/:id', verifyUserToken, deleteAddress);
router.get('/admin/address-list', verifyUserToken, getAllAddresses);
router.get('/admin/address-list/:id', verifyUserToken, getAddressById);


module.exports = router;


