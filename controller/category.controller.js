const Category = require('../schema/category.schema');
const slugify = require('slugify');
const { paginate } = require('../utils/common');
const { Op } = require('sequelize');
const { Setting } = require('../schema');

exports.createCategory = async (req, res) => {
    try {
        const { name, image } = req.body;
        const slug = slugify(name, { lower: true, strict: true });

        const category = await Category.create({ name, slug, image });
        res.status(201).json({ success: true, message: 'Category created successfully', category });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.editCategory = async (req, res) => {
    try {
        const { name, image } = req.body;
        const { slug } = req.params;

        await Category.update({ name, image }, { where: { slug } });
        res.status(200).json({ success: true, message: 'Category updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { slug } = req.params;

        const category = await Category.findOne({ where: { slug } });
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        await Category.update({ deletedAt: new Date() }, { where: { slug } });

        res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.listCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({ where: { deletedAt: null } });
        res.status(200).json({ success: true, categories });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.listCategoriesUser = async (req, res) => {
    try {
        const categories = await Category.findAll({ where: { deletedAt: null ,is_block:false } });
        res.status(200).json({ success: true, categories });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.listCategoriesPagination = async (req, res) => {
    try {
        const { page = 1, size = 10, s = '' } = req.query; // Search term 's'

        const whereCondition = { deletedAt: null };

        if (s) {
            whereCondition.name = { [Op.like]: `%${s}%` }; // Search by category name
        }

        const result = await paginate(Category, page, size, whereCondition);

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


exports.getCategoryBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const category = await Category.findOne({ where: { slug, deletedAt: null } });
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        res.status(200).json({ success: true, category });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
 
exports.adminCategoryBlock = async (req, res) => {
    try {
        const { id, is_block } = req.body; // Get category ID & block status from request

        if (typeof is_block !== 'boolean') {
            return res.status(400).json({ success: false, message: "Invalid block status" });
        }

        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        await Category.update({ is_block }, { where: { id } });

        return res.status(200).json({ success: true, message: `Category ${is_block ? 'blocked' : 'unblocked'} successfully` });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};




exports.getSettings = async (req, res) => {
    try {
        const settings = await Setting.findOne();
        return res.status(200).json({ success: true, settings });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const updateData = req.body;
        let settings = await Setting.findOne();
        
        if (settings) {
            await settings.update(updateData);
        } else {
            settings = await Setting.create(updateData);
        }

        return res.status(200).json({ success: true, message: 'Settings updated successfully', settings });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
