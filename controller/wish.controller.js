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
        const { page = 1, size = 10, search = '' } = req.query; // Add search parameter

        const limit = parseInt(size, 10);
        const offset = (parseInt(page, 10) - 1) * limit;

        // Fetch paginated wishlist items
        const { count, rows: wishlistItems } = await Wishlist.findAndCountAll({
            where: { user_id },
            limit,
            offset,
            order: [['createdAt', 'DESC']], // Sorting by createdAt in descending order
        });

        // Fetch associated products for each wishlist item and apply search filter
        const wishlistWithProducts = await Promise.all(
            wishlistItems.map(async (wishlistItem) => {
                const product = await Product.findOne({
                    where: {
                        id: wishlistItem.product_id,
                        name: { [Op.like]: `%${search}%` }, // Apply search filter
                    },
                });
                return product ? { ...wishlistItem.toJSON(), product } : null;
            })
        );

        // Filter out null values (products that don't match the search term)
        const filteredWishlist = wishlistWithProducts.filter((item) => item !== null);

        return res.status(200).json({
            success: true,
            wishlist: filteredWishlist,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page, 10),
        });
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
