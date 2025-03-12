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