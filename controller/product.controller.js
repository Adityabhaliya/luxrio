const Product = require('../schema/product.schema');
const slugify = require('slugify');
const { paginate } = require('../utils/common');
const { Op } = require('sequelize');


exports.createproduct = async (req, res) => {
  try {
    const { name, category, images, gender, weight, is_new, price, international_price, quantity, description, } = req.body;

    const slug = slugify(name, { lower: true });

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
    });


    return res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.editproduct = async (req, res) => {
  try {
    const { slug } = req.params;
    const updateData = req.body;

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

    const result = await paginate(Product, page, size, whereCondition, [['createdAt', 'DESC']]); // Order by createdAt DESC

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
    return  res.status(500).json({ success: false, error: error.message });
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