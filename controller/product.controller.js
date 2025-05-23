const Product = require('../schema/product.schema');
const slugify = require('slugify');
const { paginate } = require('../utils/common');
const { Op } = require('sequelize');
const { Wishlist, IPAddress, category } = require('../schema');

const axios = require('axios');

exports.createproduct = async (req, res) => {
  try {
    const { name, category, images, big_images, gender, short_description, weight, is_new, delivery_day, price, size, international_price, quantity, description, prices, silver_prices, material } = req.body;

    const slug = slugify(name, { lower: true });

    // Ensure prices and material are stored as JSON
    const formattedPrices = prices && typeof prices === 'object' ? JSON.stringify(prices) : null;
    const formattedsilver_prices = silver_prices && typeof silver_prices === 'object' ? JSON.stringify(silver_prices) : null;
    const formattedMaterial = material && Array.isArray(material) ? JSON.stringify(material) : null;
    const formattedsize = size && Array.isArray(size) ? JSON.stringify(size) : null;

    const product = await Product.create({
      name,
      slug,
      category,
      images,
      big_images,
      weight,
      gender,
      is_new,
      price,
      international_price,
      quantity,
      description,
      delivery_day,
      short_description,
      prices: formattedPrices, // Store JSON data properly
      silver_prices: formattedsilver_prices, // Store JSON data properly
      material: formattedMaterial, // Store material as JSON
      size: formattedsize
    });

    return res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};





exports.editproduct = async (req, res) => {
  try {
    const { slug } = req.params;
    let updateData = req.body;

    if (updateData.name) {
      updateData.slug = slugify(updateData.name, { lower: true });
    }

    if (updateData.prices && typeof updateData.prices === 'object') {
      updateData.prices = JSON.stringify(updateData.prices);
    }

    if (updateData.silver_prices && typeof updateData.silver_prices === 'object') {
      updateData.silver_prices = JSON.stringify(updateData.silver_prices);
    }


    if (updateData.material && Array.isArray(updateData.material)) {
      updateData.material = JSON.stringify(updateData.material);
    }
    if (updateData.size && Array.isArray(updateData.size)) {
      updateData.size = JSON.stringify(updateData.size);
    }

    if (updateData.is_sell === true) {
      const activeSellCount = await Product.count({ where: { is_sell: true } });
      if (activeSellCount >= 4) {
        return res.status(400).json({ success: false, message: 'Only a maximum of 4 products can have is_sell set to true.' });
      }
    }

    const updatedProduct = await Product.update(updateData, { where: { slug } });

    if (!updatedProduct[0]) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.status(200).json({ success: true, message: 'Product updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};



exports.deleteproduct = async (req, res) => {
  try {
    const { slug } = req.params;
    await Product.update({ deletedAt: new Date() }, { where: { slug } });

    return res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.listCategories = async (req, res) => {
  try {
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

    const products = await Product.findAll({ where: { deletedAt: null } });

    return res.status(200).json({ success: true, data: products, is_india });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.listProductsPagination = async (req, res) => {
  try {
    const { page = 1, size = 10, s = '' } = req.query; // Search term 's'

    const whereCondition = { deletedAt: null };

    if (s) {
      whereCondition.name = { [Op.like]: `%${s}%` }; // Search by product name
    }

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

    const result = await paginate(Product, page, size, whereCondition); // Order by createdAt DESC

    return res.status(200).json({ success: true, ...result, is_india });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.biglistProductsPagination = async (req, res) => {
  try {
    // Fetch products where big_images is NOT NULL
    const products = await Product.findAll({
      where: {
        deletedAt: null,
        big_images: { [Op.ne]: null } // Ensure big_images is not null
      }
    });

    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress; // Get IP Address

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

    return res.status(200).json({ success: true, data: products, is_india });
  } catch (error) {
    console.error("Error in biglistProductsPagination:", error); // Log error for debugging
    return res.status(500).json({ success: false, error: error.message });
  }
};
exports.genderlistProductsPagination = async (req, res) => {
  try {
    const { type } = req.query;

    if (!type || (type !== 'her' && type !== 'him')) {
      return res.status(400).json({ success: false, error: "Invalid type. Use 'her' or 'him'." });
    }

    const gender = type === 'her' ? 'Women' : 'Men';

    // Fetch products based on gender
    const products = await Product.findAll({
      where: {
        deletedAt: null,
        gender
      }
    });

    // Get user's IP address
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (!ip) {
      return res.status(400).json({ success: false, error: "IP address not found." });
    }

    let country = "Unknown";
    let is_india = false;

    // Check if IP already exists in the database
    let existingIP = await IPAddress.findOne({ where: { ip_address: ip } });

    if (existingIP) {
      country = existingIP.country;
    } else {
      // Fetch country info from external API
      const response = await axios.get(`http://ip-api.com/json/${ip}`);
      country = response.data.country || "Unknown";

      // Store IP in the database
      existingIP = await IPAddress.create({ ip_address: ip, country });
    }

    // Determine if the IP is from India
    if (country.toLowerCase() === "india") {
      is_india = true;
    }

    return res.status(200).json({
      success: true,
      data: products,
      is_india
    });

  } catch (error) {
    console.error("Error:", error); // Debugging
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.alllistProductsPagination = async (req, res) => {
  try {
    // Fetch products that are not deleted
    const products = await Product.findAll({
      where: { deletedAt: null }
    });

    // Get the user's IP Address
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
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
      try {
        // Fetch country info from external API
        const response = await axios.get(`http://ip-api.com/json/${ip}`);
        country = response.data.country || "Unknown";

        // Store in DB (Only if `country` is valid)
        existingIP = await IPAddress.create({ ip_address: ip, country });
      } catch (apiError) {
        console.error("IP lookup failed:", apiError.message);
      }
    }

    // Determine if the IP is from India
    is_india = country.toLowerCase() === "india";

    return res.status(200).json({ success: true, data: products, is_india });

  } catch (error) {
    console.error("API Error:", error); // Log for debugging
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.listProductsPaginationUser = async (req, res) => {
  try {
    const { page = 1, size = 10, s = '' } = req.query; // Search term 's'

    const whereCondition = { deletedAt: null, is_block: false };


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
    const result = await paginate(Product, page, size, whereCondition);

    const filteredProducts = s ? result.data.filter(product => {
      const productString = JSON.stringify(product).toLowerCase();
      return productString.includes(s.toLowerCase());
    }) : result.data;

    return res.status(200).json({
      success: true,
      data: filteredProducts,
      totalItems: filteredProducts.length,
      totalPages: Math.ceil(filteredProducts.length / size),
      currentPage: page,
      is_india
    });
    // return res.status(200).json({ success: true, ...result ,is_india });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};


exports.listSellProductsPaginationUser = async (req, res) => {
  try {
    const { s = '' } = req.query; // Search term 's'

    const whereCondition = { deletedAt: null, is_block: false, is_sell: true };

    if (s) {
      whereCondition[Op.or] = [
        { name: { [Op.like]: `%${s}%` } },
        { category: { [Op.like]: `%${s}%` } } // Search in category ID field
      ];
    }

    // Get IP Address
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (!ip) {
      return res.status(400).json({ success: false, error: "IP address not found." });
    }

    let country = "Unknown";
    let is_india = false;

    // Check if IP already exists in DB
    let existingIP = await IPAddress.findOne({ where: { ip_address: ip } });

    if (existingIP) {
      country = existingIP.country;
    } else {
      // Fetch country info from external API
      const response = await axios.get(`http://ip-api.com/json/${ip}`);
      country = response.data.country || "Unknown";

      // Store IP in the database
      existingIP = await IPAddress.create({ ip_address: ip, country });
    }

    // Determine if IP is from India
    if (country.toLowerCase() === "india") {
      is_india = true;
    }

    // Fetch all products matching conditions
    const products = await Product.findAll({ where: whereCondition });

    // Get category IDs from products
    const categoryIds = products.map(p => p.category).filter(id => id);

    // Fetch category names for those IDs
    const categories = await category.findAll({
      where: { id: categoryIds },
      attributes: ['id', 'name']
    });

    // Convert category list to a dictionary for quick lookup
    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {});

    // Attach category names to products
    const updatedProducts = products.map(product => ({
      ...product.toJSON(),
      category_name: categoryMap[product.category] || "Unknown" // Default if no match
    }));

    return res.status(200).json({ success: true, products: updatedProducts, is_india });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};





exports.listProductsPaginationUserBYSlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const user_id = req.user.id; // Assuming user_id is passed as a query parameter

    const whereCondition = { deletedAt: null, is_block: false, slug };

    // Fetch a single product that matches the whereCondition
    const product = await Product.findOne({ where: whereCondition });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Check if the product is in the user's wishlist
    const isInWishlist = await Wishlist.findOne({
      where: {
        user_id: user_id,
        product_id: product.id, // Use the product's ID from the fetched product
      },
    });

    // Add is_wish field to the response
    const response = {
      ...product.toJSON(), // Convert Sequelize instance to plain object
      is_wish: !!isInWishlist, // Set to true if the product is in the wishlist, otherwise false
      is_wish_id: isInWishlist?.id 
    };

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

    return res.status(200).json({ success: true, data: response, is_india });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.listRecommandProductsPaginationUserBYSlug = async (req, res) => {
  try {
    const { page = 1, size = 10 } = req.query;
    const { slug } = req.query;

    // Find the product by slug
    const product = await Product.findOne({ where: { slug, deletedAt: null, is_block: false } });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

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

    // Fetch all products with the same category
    const whereCondition = {
      deletedAt: null,
      is_block: false,
      category: product.category // Assuming category_id exists in Product model
    };

    const result = await paginate(Product, page, size, whereCondition);

    return res.status(200).json({ success: true, ...result, is_india });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};




exports.getproductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ where: { slug, deletedAt: null } });
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
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.status(200).json({ success: true, data: product, is_india });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.adminProductBlock = async (req, res) => {
  try {
    const { id, is_block } = req.body; // Get product ID & block status from request

    if (typeof is_block !== 'boolean') {
      return res.status(400).json({ success: false, message: "Invalid block status" });
    }

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    await Product.update({ is_block }, { where: { id } });

    return res.status(200).json({ success: true, message: `Product ${is_block ? 'blocked' : 'unblocked'} successfully` });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};