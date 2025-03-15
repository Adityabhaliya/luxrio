const Category = require('../schema/category.schema');
const slugify = require('slugify');
const { paginate } = require('../utils/common');
const { Op } = require('sequelize');
const { Setting } = require('../schema');
const Order = require('../schema/order.schema');
const stripe = require('stripe')('sk_test_51R0hP8DPYqiRFj9aK46wcnApxCkAe8UMXSzPyVdIUfONAOI5pxAEJmkVU10y1665fXUuMcWBctdmGKj5lnINODhD005MwChyhy');

exports.createOrder = async (req, res) => {
    try {
        const { total_amount, currency, product_ids, address_id } = req.body;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(total_amount * 100),
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
            const products = await Promise.all(order.product_ids.map(async (productId) => {
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
        const user_id = req.user.id;

        const whereCondition = { };
        if (status) {
            whereCondition.status = { [Op.like]: `%${status}%` };
        }

        const result = await paginate(Order, page, size, whereCondition);

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
