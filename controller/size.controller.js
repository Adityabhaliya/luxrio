const Category = require('../schema/category.schema');
const slugify = require('slugify');
const { paginate } = require('../utils/common');
const { Op } = require('sequelize');
const { Setting, Size } = require('../schema');
const axios = require('axios');

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