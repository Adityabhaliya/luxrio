const Category = require('../schema/category.schema');
const slugify = require('slugify');
const { paginate } = require('../utils/common');
const { Op } = require('sequelize');
const { Setting, Product, User, Address } = require('../schema');
const Order = require('../schema/order.schema');
const stripe = require('stripe')('sk_test_51R0hP8DPYqiRFj9aK46wcnApxCkAe8UMXSzPyVdIUfONAOI5pxAEJmkVU10y1665fXUuMcWBctdmGKj5lnINODhD005MwChyhy');

exports.createOrder = async (req, res) => {
    try {
        const { total_amount, currency, product_ids, address_id } = req.body;

        // Check if amount is at least 50 INR
        if (total_amount < 50 && currency === 'INR') {
            return res.status(400).json({ success: false, error: "Amount must be at least 50 INR." });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(total_amount * 100), // Convert to paise for INR
            currency,
            payment_method_types: ['card'],
        });

        const order = await Order.create({
            user_id: req.user.id,
            product_ids,
            total_amount,
            currency,
            address_id,
            payment_id: paymentIntent.id
        });

        res.status(200).json({ success: true, clientSecret: paymentIntent.client_secret, order });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


// Verify Order API
exports.verifyOrder = async (req, res) => {
    try {
        const { orderId, paymentIntentId } = req.body;

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            await Order.update({ status: 'Completed' }, { where: { id: orderId } });
            res.status(200).json({ success: true, message: 'Payment successful and order verified.' });
        } else {
            res.status(400).json({ success: false, message: 'Payment not completed.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.listOrders = async (req, res) => {
    try {
        const { page = 1, size = 10, status = '' } = req.query;
        const user_id = req.user.id;

        const whereCondition = { user_id };
        if (status) {
            whereCondition.status = { [Op.like]: `%${status}%` };
        }

        const result = await paginate(Order, page, size, whereCondition);

        const ordersWithProducts = await Promise.all(result.data.map(async (order) => {
            const productIds = JSON.parse(order.product_ids); // Parse the product_ids JSON string
            const products = await Promise.all(productIds.map(async (productId) => {
                return await Product.findOne({ where: { id: productId } });
            }));

            return { ...order.toJSON(), products };
        }));

        res.status(200).json({ success: true, data: ordersWithProducts, totalItems: result.totalItems, totalPages: result.totalPages });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


exports.listOrdersAdmin = async (req, res) => {
    try {
        const { page = 1, size = 10, status = '' } = req.query;

        const whereCondition = {};
        if (status) {
            whereCondition.status = { [Op.like]: `%${status}%` };
        }

        const result = await paginate(Order, page, size, whereCondition);

        const ordersWithProducts = await Promise.all(result.data.map(async (order) => {
            const productIds = JSON.parse(order.product_ids);
            const products = await Promise.all(productIds.map(async (productId) => {
                return await Product.findOne({ where: { id: productId } });
            }));

            const user = await User.findOne({ where: { id: order.user_id } });
            const address = await Address.findOne({ where: { id: order.address_id } });

            return {
                ...order.toJSON(), products, user: user ? user.toJSON() : null,
                address: address ? address.toJSON() : null
            };
        }));

        res.status(200).json({ success: true, data: ordersWithProducts, totalItems: result.totalItems, totalPages: result.totalPages });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

