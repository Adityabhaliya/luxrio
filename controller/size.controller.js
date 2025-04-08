const Category = require('../schema/category.schema');
const slugify = require('slugify');
const { paginate } = require('../utils/common');
const { Op, where } = require('sequelize');
const { Setting, Size,  order_details, User, orderlikes } = require('../schema');
const axios = require('axios');
const ratingSchema = require('../schema/rating.schema');
const moment = require('moment'); // import moment

exports.createSize = async (req, res) => {
  try {
    const size = await Size.create(req.body);
    return res.status(201).json({ success: true, message: 'Size created successfully', size });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAllSizes = async (req, res) => {
  try {
    const { page = 1, size = 10, s = '' } = req.query;

    const whereCondition = {};

    // If a search term (s) is provided, filter by category_name
    if (s) {
      const categories = await Category.findAll({
        where: {
          name: {
            [Op.like]: `%${s}%` // Use Sequelize's Op.like for partial matching
          }
        }
      });

      // Extract category IDs from the filtered categories
      const categoryIds = categories.map(category => category.id);

      // Add category IDs to the whereCondition
      whereCondition.category_id = {
        [Op.in]: categoryIds // Filter sizes by category IDs
      };
    }

    // Paginate the sizes
    const result = await paginate(Size, page, size, whereCondition);

    // Fetch category names for each size
    const sizesWithCategory = await Promise.all(result.data.map(async (size) => {
      const category = await Category.findOne({ where: { id: size.category_id } });
      return { ...size.toJSON(), category_name: category ? category.name : null };
    }));

    return res.status(200).json({
      success: true,
      data: sizesWithCategory,
      totalItems: result.totalItems,
      totalPages: result.totalPages
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};


exports.getSizeById = async (req, res) => {
  try {
    const { id } = req.params;
    const size = await Size.findOne({ where: { id } });
    if (!size) {
      return res.status(404).json({ success: false, message: 'Size not found' });
    }
    const category = await Category.findOne({ where: { id: size.category_id } });
    return res.status(200).json({ success: true, size: { ...size.toJSON(), category_name: category ? category.name : null } });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getCategorySizeById = async (req, res) => {
  try {
    const { id } = req.params;
    const sizes = await Size.findAll({ where: { category_id: id } });

    const sizesWithCategory = await Promise.all(sizes.map(async (size) => {
      const category = await Category.findOne({ where: { id: size.category_id } });
      return { ...size.toJSON(), category_name: category ? category.name : null };
    }));

    if (!sizes) {
      return res.status(404).json({ success: false, message: 'Sizes not found' });
    }
    return res.status(200).json({ success: true, sizes: sizesWithCategory });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
exports.updateSize = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Size.update(req.body, { where: { id } });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Size not found or no changes made' });
    }
    const updatedSize = await Size.findOne({ where: { id } });
    return res.status(200).json({ success: true, message: 'Size updated successfully', size: updatedSize });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteSize = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Size.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Size not found' });
    }
    return res.status(200).json({ success: true, message: 'Size deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};


exports.addReview = async (req, res) => {
  try {
    const { product_id, order_id, rating, description } = req.body;
    const user_id = req.user.id;


    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
    }

    const existing = await ratingSchema.findOne({ where: { user_id, product_id } });
    if (existing) {
      return res.status(400).json({ success: false, message: "You have already reviewed this product." });
    }

    const newRating = await ratingSchema.create({
      user_id,
      product_id,
      order_id,
      rating,
      description
    });

    res.status(201).json({ success: true, message: "Review added successfully", data: newRating });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.editReview = async (req, res) => {
  try {
    const { id } = req.params; // Review ID in URL
    const { rating, description } = req.body;
    const user_id = req.user.id;

    if (!id) {
      return res.status(400).json({ success: false, message: "Review ID is required." });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
    }

    const existing = await ratingSchema.findOne({ where: { id, user_id } });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Review not found or you are not authorized to update it." });
    }

    existing.rating = rating !== undefined ? rating : existing.rating;
    existing.description = description !== undefined ? description : existing.description;

    await existing.save();

    res.status(200).json({ success: true, message: "Review updated successfully", data: existing });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAllReviews = async (req, res) => {
  try {
    const user_id = req.user.id;

    const reviews = await ratingSchema.findAll({ where: { user_id } });

    res.status(200).json({
      success: true,
      message: "All reviews fetched successfully.",
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const review = await ratingSchema.findOne({ where: { id, user_id } });

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    res.status(200).json({
      success: true,
      message: "Review fetched successfully.",
      data: review,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// controllers/reviewSampleController.js

exports.getSampleRatings = async (req, res) => {
  try {
    const sampleReviews = [
      {
        image: "https://fastly.picsum.photos/id/288/200/300.jpg?hmac=45WLionXnoogi0-njKuSNnVY5hnswMhf-CrxwzKTcrc",
        name: "Amit Sharma",
        rating: 5,
        description: "Absolutely loved the product! Great quality and fast delivery."
      },
      {
        image: "https://fastly.picsum.photos/id/288/200/300.jpg?hmac=45WLionXnoogi0-njKuSNnVY5hnswMhf-CrxwzKTcrc",
        name: "Pooja Patel",
        rating: 4.5,
        description: "Good product overall, would definitely recommend to others."
      },
      {
        image: "https://fastly.picsum.photos/id/288/200/300.jpg?hmac=45WLionXnoogi0-njKuSNnVY5hnswMhf-CrxwzKTcrc",
        name: "Rahul Mehra",
        rating: 4,
        description: "Nice and affordable. Could improve the packaging."
      },
      {
        image: "https://fastly.picsum.photos/id/288/200/300.jpg?hmac=45WLionXnoogi0-njKuSNnVY5hnswMhf-CrxwzKTcrc",
        name: "Sneha Roy",
        rating: 5,
        description: "Exceeded my expectations! Very happy with my purchase."
      },
      {
        image: "https://fastly.picsum.photos/id/288/200/300.jpg?hmac=45WLionXnoogi0-njKuSNnVY5hnswMhf-CrxwzKTcrc",
        name: "Vikram Joshi",
        rating: 3.5,
        description: "Product is decent, but shipping took longer than expected."
      }
    ];

    res.status(200).json({
      success: true,
      message: "random reviews fetched successfully",
      data: sampleReviews
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};



exports.getProductReview = async (req, res) => {
  try {
    const user_id = req.user.id;

    const product_id = req.params.id;

    if (!product_id) {
      return res.status(400).json({ success: false, message: "Product ID is required." });
    }

    // Step 1: Find all order_details with this product_id
    const orderDetails = await order_details.findAll({
      where: { product_id }
    });

    if (!orderDetails || orderDetails.length === 0) {
      return res.status(404).json({ success: false, message: "No orders found for this product." });
    }

    // Step 2: Extract order_ids from orderDetails
    const orderIds = orderDetails.map(detail => detail.order_id);

    // Step 3: Find ratings where order_id is in those orderIds
    const ratings = await ratingSchema.findAll({
      where: {
        order_id: orderIds
      }
    });

    // Step 4: Add user and timeAgo field
    const ratingsWithUser = await Promise.all(ratings.map(async (rating) => {
      const user = await User.findOne({ where: { id: rating.user_id } });
      const likeData = await orderlikes.findOne({
        where: {
          user_id,
          rating_id: rating.id
        }
      });
      return {
        ...rating.toJSON(),
        user: user ? {
          id: user.id,
          name: user.name,
          lastname: user.lastname,
          email: user.email
        } : null,
        timeAgo: moment(rating.createdAt).fromNow(), // e.g., "2 days ago"
        is_like: likeData ? likeData.is_like : false,
        is_unlike: likeData ? likeData.is_unlike : false
      };
    }));

    res.status(200).json({
      success: true,
      message: "Product reviews fetched successfully.",
      data: ratingsWithUser
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};



exports.updateRatingLikeUnlike = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { rating_id, rate_like, rate_unlike, like_increment, unlike_increment } = req.body;

    if (!rating_id) {
      return res.status(400).json({ success: false, message: "rating_id is required." });
    }

    const rating = await ratingSchema.findOne({ where: { id: rating_id } });
    if (!rating) {
      return res.status(404).json({ success: false, message: "Rating not found." });
    }

    // Check if entry exists in orderlikes table
    let orderLike = await orderlikes.findOne({
      where: { rating_id, user_id }
    });

    // Case 1: New Like/Unlike action
    if (!orderLike) {
      const newLike = {
        user_id,
        rating_id,
        is_like: false,
        is_unlike: false
      };

      if (rate_like === true) {
        rating.rate_like += 1;
        newLike.is_like = true;
      }

      if (rate_unlike === true) {
        rating.rate_unlike += 1;
        newLike.is_unlike = true;
      }

      await orderlikes.create(newLike);
      await rating.save();
    }

    // Case 2: Increment toggling
    if (orderLike) {

      if(rate_like === true){
        if(orderLike.is_like === true){
          rating.rate_like -= 1;
        }
        orderLike.is_like = false;

      }

      if(rate_unlike === true){
        if(orderLike.is_unlike === true){
          rating.rate_unlike -= 1;
        }
        orderLike.is_unlike = false;

      }

      if (like_increment === true) {
        if (orderLike.is_unlike === true) {
          rating.rate_unlike = Math.max(0, rating.rate_unlike - 1);
        }
        if (orderLike.is_like === false) {
          rating.rate_like += 1;
        }

        orderLike.is_like = true;
        orderLike.is_unlike = false;
      }

      if (unlike_increment === true) {
        if (orderLike.is_like === true) {
          rating.rate_like = Math.max(0, rating.rate_like - 1);
        }
        if (orderLike.is_unlike === false) {
          rating.rate_unlike += 1;
        }

        orderLike.is_like = false;
        orderLike.is_unlike = true;
      }

      await orderLike.save();
      await rating.save();
    }

    res.status(200).json({
      success: true,
      message: "Rating like/unlike updated successfully.",
      data: {
        rate_like: rating.rate_like,
        rate_unlike: rating.rate_unlike
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};




