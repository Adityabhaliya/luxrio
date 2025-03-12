const Category = require('../schema/category.schema');
const slugify = require('slugify');
const { paginate } = require('../utils/common');
const { Op } = require('sequelize');
const { Setting, Size } = require('../schema');

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
        const sizes = await Size.findAll();
        return res.status(200).json({ success: true, sizes });
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
        return res.status(200).json({ success: true, size });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

exports.getCategorySizeById = async (req, res) => {
    try {
        const { id } = req.params;
        const size = await Size.findAll({ where: { category_id:id } });
        if (!size) {
            return res.status(404).json({ success: false, message: 'Size not found' });
        }
        return res.status(200).json({ success: true, size });
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