const Cart = require('../schema/cart.schema');
const slugify = require('slugify');
const { paginate } = require('../utils/common');
const { Op } = require('sequelize');

exports.addToCart = async (req, res) => {
    try {
        const user_id = req.user.id; // Get user_id from token

        const {   product_id, quantity, amount, size, carat, material_type } = req.body;
        const cartItem = await Cart.create({ user_id, product_id, quantity, amount, size, carat, material_type });
        return res.status(201).json({ success: true, message: 'Item added to cart', cartItem });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// Edit Cart API
exports.editCart = async (req, res) => {
    try {
        const user_id = req.user.id; // Get user_id from token

        const { id } = req.params;
        const updateData = req.body;
        const updatedCart = await Cart.update(updateData, { where: {user_id, id } });
        if (!updatedCart[0]) {
            return res.status(404).json({ success: false, message: 'Cart item not found' });
        }
        return res.status(200).json({ success: true, message: 'Cart updated successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// List Cart Items API
exports.listCart = async (req, res) => {
    try {
        const user_id = req.user.id; // Get user_id from token
        const whereCondition = user_id ? { user_id } : {};
        const cartItems = await Cart.findAll({ where: whereCondition });
        return res.status(200).json({ success: true, cartItems });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteCartItem = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id; // Ensure user can only delete their own cart item
        
        const deletedCart = await Cart.destroy({ where: { id, user_id } });
        if (!deletedCart) {
            return res.status(404).json({ success: false, message: 'Cart item not found or unauthorized' });
        }
        return res.status(200).json({ success: true, message: 'Cart item deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

