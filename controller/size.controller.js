const Category = require('../schema/category.schema');
const slugify = require('slugify');
const { paginate } = require('../utils/common');
const { Op, where } = require('sequelize');
const { Setting, Size, Rating } = require('../schema');
const axios = require('axios');
const ratingSchema = require('../schema/rating.schema');

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
        const { product_id,order_id, rating, description } = req.body;
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


