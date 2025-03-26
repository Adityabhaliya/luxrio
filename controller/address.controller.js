const blog = require('../schema/blog.schema');
const slugify = require('slugify');
const { paginate } = require('../utils/common');
const { Op } = require('sequelize');
const { Address, IPAddress } = require('../schema');

const axios = require('axios');
  
exports.createAddress = async (req, res) => {
    try {
        const user_id = req.user.id;
   

        // Create address
        const address = await Address.create({ ...req.body, user_id });

        return res.status(201).json({
            success: true,
            message: "Address added successfully",
            address,
         });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        const [updated] = await Address.update(req.body, { where: { id, user_id } });
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Address not found or no changes made' });
        }
        const updatedAddress = await Address.findOne({ where: { id, user_id } });
        return res.status(200).json({ success: true, message: 'Address updated successfully', address: updatedAddress });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

exports.getAllAddresses = async (req, res) => {
    try {
        const user_id = req.user.id;
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
        const addresses = await Address.findAll({ where: { user_id } });
        return res.status(200).json({ success: true, addresses ,is_india});
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

exports.getAddressById = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
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
        const address = await Address.findOne({ where: { id, user_id } });
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }
        return res.status(200).json({ success: true, address, is_india });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        const deleted = await Address.destroy({ where: { id, user_id } });
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }
        return res.status(200).json({ success: true, message: 'Address deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};