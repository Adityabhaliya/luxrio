const Product = require('../schema/product.schema');
const slugify = require('slugify');
const { paginate } = require('../utils/common');
const { Op } = require('sequelize');


exports.createproduct = async (req, res) => {
  try {
    const { name, category, images, gender, weight, is_new, price, international_price, quantity, description, prices, material } = req.body;

    const slug = slugify(name, { lower: true });

    // Ensure prices and material are stored as JSON
    const formattedPrices = prices && typeof prices === 'object' ? JSON.stringify(prices) : null;
    const formattedMaterial = material && Array.isArray(material) ? JSON.stringify(material) : null;

    const product = await Product.create({
      name,
      slug,
      category,
      images,
      weight,
      gender,
      is_new,
      price,
      international_price,
      quantity,
      description,
      prices: formattedPrices, // Store JSON data properly
      material: formattedMaterial, // Store material as JSON
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

    // If the name is being updated, regenerate the slug
    if (updateData.name) {
      updateData.slug = slugify(updateData.name, { lower: true });
    }

    // Ensure prices and material are stored as JSON if provided
    if (updateData.prices && typeof updateData.prices === 'object') {
      updateData.prices = JSON.stringify(updateData.prices);
    }
    if (updateData.material && Array.isArray(updateData.material)) {
      updateData.material = JSON.stringify(updateData.material);
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
    const products = await Product.findAll({ where: { deletedAt: null } });

    return res.status(200).json({ success: true, data: products });
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

    const result = await paginate(Product, page, size, whereCondition); // Order by createdAt DESC

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};


exports.listProductsPaginationUser = async (req, res) => {
  try {
    const { page = 1, size = 10, s = '' } = req.query; // Search term 's'

    const whereCondition = { deletedAt: null, is_block: false };

    if (s) {
      whereCondition[Op.or] = [
        { name: { [Op.like]: `%${s}%` } }, // Search by name
        { category: { [Op.like]: `%${s}%` } } // Search by category
      ];
    }

    const result = await paginate(Product, page, size, whereCondition);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};


exports.listProductsPaginationUserBYSlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const whereCondition = { deletedAt: null, is_block: false, slug };

    // Fetch a single product that matches the whereCondition
    const product = await Product.findOne({ where: whereCondition });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, data: product });
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

    // Fetch all products with the same category
    const whereCondition = { 
      deletedAt: null, 
      is_block: false, 
      category: product.category // Assuming category_id exists in Product model
    };

    const result = await paginate(Product, page, size, whereCondition);

    return res.status(200).json({ success: true, ...result });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};




exports.getproductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ where: { slug, deletedAt: null } });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.status(200).json({ success: true, data: product });
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