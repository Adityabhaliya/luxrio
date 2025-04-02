const Product = require('../schema/product.schema');
const slugify = require('slugify');
const { paginate } = require('../utils/common');
const { Op } = require('sequelize');
const { Wishlist, IPAddress, AboutUs, Setting } = require('../schema');
const home_settings = require('../schema/home_setting.schema');
const InstaPost = require('../schema/insta.schema');
const FAQ = require('../schema/faq.schema');
const axios = require('axios');

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

        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress; // Get IP Address

        if (!ip) {
            return res.status(400).json({ success: false, error: "IP address not found." });
        }

        let country = "Unknown";
        let is_india = false;

        // Check if the IP is already stored
        let existingIP = await IPAddress.findOne({ where: { ip_address: ip } });

        if (existingIP) {
            country = existingIP.country;
        } else {
            // Fetch country info from external API
            const response = await axios.get(`http://ip-api.com/json/${ip}`);
            country = response.data.country || "Unknown";

            // Store in DB
            existingIP = await IPAddress.create({ ip_address: ip, country });
        }

        // Determine if the IP is from India
        if (country.toLowerCase() === "india") {
            is_india = true;
        }

        return res.status(200).json({
            success: true,
            wishlist: filteredWishlist,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page, 10),
            is_india
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




exports.addupdatebanner1 = async (req, res) => {
    try {
        const { key, value } = req.body;

        if (!key || !value) {
            return res.status(400).json({ success: false, error: "Both 'key' and 'value' are required." });
        }

        // Check if the record with the provided key exists
        const existingRecord = await home_settings.findOne({ where: { key } });

        if (existingRecord) {
            // Update the record
            await home_settings.update(
                { value },
                { where: { key } }
            );

            return res.status(200).json({ success: true, message: "Home setting updated successfully." });
        } else {
            // Create a new record
            await home_settings.create({ key, value });

            return res.status(201).json({ success: true, message: "Home setting created successfully." });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};


exports.listHomeSettings = async (req, res) => {
    try {
        const key = req.query.key
        const data = await home_settings.findAll({ where: { key } });

        if (!data || data.length === 0) {
            return res.status(404).json({ success: false, message: "No home settings found." });
        }

        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

exports.listHomeSettingsUser = async (req, res) => {
    try {
        const key = req.query.key
        const data = await home_settings.findAll({ where: { key } });

        if (!data || data.length === 0) {
            return res.status(404).json({ success: false, message: "No home settings found." });
        }

        const aboutUs = await AboutUs.findOne();
        if (!aboutUs) {
            return res.status(404).json({ success: false, error: "About Us data not found." });
        }
        const setting = await Setting.findOne();

        return res.status(200).json({ success: true, data ,aboutUs , term_condition: setting.term_condition});
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};





exports.createInstaPost = async (req, res) => {
    try {
        const { image, url } = req.body;

        if (!image || !url) {
            return res.status(400).json({ success: false, error: "Image and URL are required." });
        }

        const instaPost = await InstaPost.create({ image, url });

        return res.status(201).json({ success: true, data: instaPost });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// Get all InstaPosts
exports.listInstaPosts = async (req, res) => {
    try {
        const instaPosts = await InstaPost.findAll({ where: { deletedAt: null } });
        return res.status(200).json({ success: true, data: instaPosts });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// Get a single InstaPost by ID
exports.getInstaPost = async (req, res) => {
    try {
        const { id } = req.params;
        const instaPost = await InstaPost.findOne({ where: { id } });

        if (!instaPost) {
            return res.status(404).json({ success: false, error: "InstaPost not found." });
        }

        return res.status(200).json({ success: true, data: instaPost });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// Update an InstaPost
exports.updateInstaPost = async (req, res) => {
    try {
        const { id } = req.params;
        const { image, url } = req.body;

        const instaPost = await InstaPost.findOne({ where: { id } });

        if (!instaPost) {
            return res.status(404).json({ success: false, error: "InstaPost not found." });
        }

        await InstaPost.update({ image, url }, { where: { id } });

        return res.status(200).json({ success: true, message: "InstaPost updated successfully." });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// Delete an InstaPost
exports.deleteInstaPost = async (req, res) => {
    try {
        const { id } = req.params;

        const instaPost = await InstaPost.findOne({ where: { id } });

        if (!instaPost) {
            return res.status(404).json({ success: false, error: "InstaPost not found." });
        }

        await InstaPost.destroy({ where: { id } });

        return res.status(200).json({ success: true, message: "InstaPost deleted successfully." });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};


exports.listFAQs = async (req, res) => {
    try {
        const faqs = await FAQ.findAll(); // Order by createdAt DESC

        return res.status(200).json({ success: true, data: faqs });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

exports.listFAQsbyid = async (req, res) => {
    try {
        const { id } = req.params;

        const faqs = await FAQ.findOne({ where: { id: id } });
        return res.status(200).json({ success: true, data: faqs });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

exports.createFAQ = async (req, res) => {
    try {
        const { question, answer } = req.body;

        if (!question || !answer) {
            return res.status(400).json({ success: false, error: "Question and Answer are required." });
        }

        const faq = await FAQ.create({ question, answer });
        return res.status(201).json({ success: true, message: "FAQ created successfully.", faq });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateFAQ = async (req, res) => {
    try {
        const { id } = req.params;
        const { question, answer } = req.body;

        const faq = await FAQ.findByPk(id);
        if (!faq) {
            return res.status(404).json({ success: false, error: "FAQ not found." });
        }

        await FAQ.update({ question, answer }, { where: { id } });
        return res.status(200).json({ success: true, message: "FAQ updated successfully." });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteFAQ = async (req, res) => {
    try {
        const { id } = req.params;

        const faq = await FAQ.findByPk(id);
        if (!faq) {
            return res.status(404).json({ success: false, error: "FAQ not found." });
        }

        await FAQ.destroy({ where: { id } });
        return res.status(200).json({ success: true, message: "FAQ deleted successfully." });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

