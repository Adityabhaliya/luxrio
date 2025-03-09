const Product = require('../schema/product.schema');
const slugify = require('slugify');
const { paginate } = require('../utils/common');
const { Op } = require('sequelize');
const { Wishlist } = require('../schema');


exports.createproduct = async (req, res) => {
  try {
    const { name, category, images, gender, weight, is_new,delivery_day, price, size, international_price, quantity, description, prices, material } = req.body;

    const slug = slugify(name, { lower: true });

    // Ensure prices and material are stored as JSON
    const formattedPrices = prices && typeof prices === 'object' ? JSON.stringify(prices) : null;
    const formattedMaterial = material && Array.isArray(material) ? JSON.stringify(material) : null;
    const formattedsize = size && Array.isArray(size) ? JSON.stringify(size) : null;

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
      delivery_day,
      prices: formattedPrices, // Store JSON data properly
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


exports.listSellProductsPaginationUser = async (req, res) => {
  try {
    const { s = '' } = req.query; // Search term 's'
    const whereCondition = { deletedAt: null, is_block: false, is_sell: true };

    if (s) {
      whereCondition[Op.or] = [
        { name: { [Op.like]: `%${s}%` } }, // Search by name
        { category: { [Op.like]: `%${s}%` } } // Search by category
      ];
    }

    const products = await Product.findAll({ where: whereCondition });
    return res.status(200).json({ success: true, products });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};




exports.listProductsPaginationUserBYSlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const { user_id } = req.query; // Assuming user_id is passed as a query parameter

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
    };

    return res.status(200).json({ success: true, data: response });
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