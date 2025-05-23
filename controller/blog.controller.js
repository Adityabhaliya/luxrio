const blog = require('../schema/blog.schema');
const slugify = require('slugify');
const { paginate } = require('../utils/common');
const { Op } = require('sequelize');
const { IPAddress } = require('../schema');

const axios = require('axios');



exports.createblog = async (req, res) => {
  try {
    const { title,
      description,
      images,
      meta_title,
      meta_description,
      meta_keyword ,tags} = req.body;

    const slug = slugify(title, { lower: true });

    const blogs = await blog.create({
      title,
      description,
      images,
      meta_title,
      meta_description,
      meta_keyword,
      slug,
      tags
    });


    return res.status(201).json({ success: true, message: 'blog created successfully', data: blogs });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.editblog = async (req, res) => {
  try {
    const { slug } = req.params;
    const updateData = req.body;

    const updatedblog = await blog.update(updateData, { where: { slug } });

    if (!updatedblog[0]) {
      return res.status(404).json({ success: false, message: 'blog not found' });
    }

    return res.status(200).json({ success: true, message: 'blog updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteblog = async (req, res) => {
  try {
    const { slug } = req.params;
    await blog.update({ deletedAt: new Date() }, { where: { slug } });

    return res.status(200).json({ success: true, message: 'blog deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.listblog = async (req, res) => {
  try {
    const blogs = await blog.findAll({ where: { deletedAt: null } });
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
    return res.status(200).json({ success: true, data: blogs ,is_india });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.listblogsPagination = async (req, res) => {
  try {
    const { page = 1, size = 10, s = '' } = req.query; // Search term 's'
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
    const whereCondition = { deletedAt: null };

    if (s) {
      whereCondition.title = { [Op.like]: `%${s}%` }; // Search by blog name
    }

    const result = await paginate(blog, page, size, whereCondition); // Order by createdAt DESC

    return res.status(200).json({ success: true, ...result ,is_india });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.listblogsPaginationUser = async (req, res) => {
  try {
    const { page = 1, size = 10, s = '' } = req.query; // Search term 's'
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
    const whereCondition = { deletedAt: null, is_block: false };

    if (s) {
      whereCondition.name = { [Op.like]: `%${s}%` };
    }

    const result = await paginate(blog, page, size, whereCondition);
    return res.status(200).json({ success: true, ...result ,is_india });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

  
exports.getblogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
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
    const blogs = await blog.findOne({ where: { slug, deletedAt: null } });

    if (!blogs) {
      return res.status(404).json({ success: false, message: 'blog not found' });
    }

    return res.status(200).json({ success: true, data: blogs ,is_india });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.adminblogBlock = async (req, res) => {
  try {
    const { id, is_block } = req.body; // Get blog ID & block status from request

    if (typeof is_block !== 'boolean') {
      return res.status(400).json({ success: false, message: "Invalid block status" });
    }

    const blogs = await blog.findByPk(id);
    if (!blogs) {
      return res.status(404).json({ success: false, message: "blog not found" });
    }

    await blog.update({ is_block }, { where: { id } });

    return res.status(200).json({ success: true, message: `blog ${is_block ? 'blocked' : 'unblocked'} successfully` });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};