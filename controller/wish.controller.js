const Product = require('../schema/product.schema');
const slugify = require('slugify');
const { paginate } = require('../utils/common');
const { Op } = require('sequelize');
const { Wishlist } = require('../schema');

// Add to Wishlist API
exports.addToWishlist = async (req, res) => {
    try {
        const { product_id } = req.body;
        const user_id = req.user.id;

        const wishlistItem = await Wishlist.create({ user_id, product_id });
        return res.status(201).json({ success: true, message: 'Item added to wishlist', wishlistItem });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// List Wishlist API
exports.listWishlist = async (req, res) => {
    try {
        const user_id = req.user.id;
        const wishlistItems = await Wishlist.findAll({ where: { user_id } });

        const wishlistWithProducts = await Promise.all(wishlistItems.map(async (wishlistItem) => {
            const product = await Product.findOne({ where: { id: wishlistItem.product_id } });
            return { ...wishlistItem.toJSON(), product };
        }));

        return res.status(200).json({ success: true, wishlist: wishlistWithProducts });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// Remove from Wishlist API
exports.removeFromWishlist = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        const deletedWishlist = await Wishlist.destroy({ where: { id, user_id } });
        if (!deletedWishlist) {
            return res.status(404).json({ success: false, message: 'Wishlist item not found or unauthorized' });
        }
        return res.status(200).json({ success: true, message: 'Item removed from wishlist' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
