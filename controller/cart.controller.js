const Cart = require('../schema/cart.schema');
const Product = require('../schema/product.schema');
const slugify = require('slugify');
const { paginate } = require('../utils/common');
const { Op } = require('sequelize');
const { Setting, AboutUs, IPAddress } = require('../schema');

exports.addToCart = async (req, res) => {
    try {
        const user_id = req.user.id; // Get user_id from token

        const { product_id, quantity, amount, size, carat, material_type, weight  } = req.body;
        const cartItem = await Cart.create({ user_id, product_id, quantity, amount, size, carat, material_type, weight });
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

        const settings = await Setting.findOne();

        const cartWithProducts = await Promise.all(cartItems.map(async (cartItem) => {
            const product = await Product.findOne({ where: { id: cartItem.product_id } });
            return { ...cartItem.toJSON(), product };
        }));

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
            cartItems: cartWithProducts,
            sale_tax: settings?.sale_tax || 0,
            international_sale_tax: settings?.international_sale_tax || 0,
            shipping_charge: settings?.shipping_charge || 0,
            international_shipping_charge: settings?.international_shipping_charge || 0,
            stripe_key: settings?.stripe_key || null,
            is_india
        });
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


exports.getPrivacyPolicy = async (req, res) => {
    try {
        const setting = await Setting.findOne();
        if (!setting) return res.status(404).json({ success: false, error: "Privacy Policy not found." });

        return res.status(200).json({ success: true, privacy_policy: setting.privacy_policy });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// Update Privacy Policy
exports.updatePrivacyPolicy = async (req, res) => {
    try {
        const { privacy_policy } = req.body;

        if (!privacy_policy) {
            return res.status(400).json({ success: false, error: "Privacy Policy is required." });
        }

        const setting = await Setting.findOne();
        
        if (setting) {
            await Setting.update({ privacy_policy }, { where: { id: setting.id } });
            return res.status(200).json({ success: true, message: "Privacy Policy updated successfully." });
        } else {
            await Setting.create({ privacy_policy });
            return res.status(201).json({ success: true, message: "Privacy Policy created successfully." });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// Get Terms & Conditions
exports.getTermCondition = async (req, res) => {
    try {
        const setting = await Setting.findOne();
        if (!setting) return res.status(404).json({ success: false, error: "Terms & Conditions not found." });

        return res.status(200).json({ success: true, term_condition: setting.term_condition });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// Update Terms & Conditions
exports.updateTermCondition = async (req, res) => {
    try {
        const { term_condition } = req.body;

        if (!term_condition) {
            return res.status(400).json({ success: false, error: "Terms & Conditions are required." });
        }

        const setting = await Setting.findOne();
        
        if (setting) {
            await Setting.update({ term_condition }, { where: { id: setting.id } });
            return res.status(200).json({ success: true, message: "Terms & Conditions updated successfully." });
        } else {
            await Setting.create({ term_condition });
            return res.status(201).json({ success: true, message: "Terms & Conditions created successfully." });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};


exports.getAboutUs = async (req, res) => {
    try {
        const aboutUs = await AboutUs.findOne();
        if (!aboutUs) {
            return res.status(404).json({ success: false, error: "About Us data not found." });
        }
        
        res.status(200).json({ success: true, data: aboutUs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Create or Update About Us
exports.createOrUpdateAboutUs = async (req, res) => {
    try {
        const { description, mobileno, right_image, left_image } = req.body;

        const existingAboutUs = await AboutUs.findOne();

        if (existingAboutUs) {
            // Update Existing Record
            await AboutUs.update({ description, mobileno, right_image, left_image }, { where: { id: existingAboutUs.id } });
            return res.status(200).json({ success: true, message: "About Us updated successfully." });
        } else {
            // Create New Record
            await AboutUs.create({ description, mobileno, right_image, left_image });
            return res.status(201).json({ success: true, message: "About Us created successfully." });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};