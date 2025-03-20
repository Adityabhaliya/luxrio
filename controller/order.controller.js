const Category = require('../schema/category.schema');
const slugify = require('slugify');
const { paginate } = require('../utils/common');
const { Op } = require('sequelize');
const { Setting, Product, User, Address, order_details } = require('../schema');
const Order = require('../schema/order.schema');
const Cart = require('../schema/cart.schema');
const stripe = require('stripe')('sk_test_51R0hP8DPYqiRFj9aK46wcnApxCkAe8UMXSzPyVdIUfONAOI5pxAEJmkVU10y1665fXUuMcWBctdmGKj5lnINODhD005MwChyhy');

exports.createOrder = async (req, res) => {
    try {
        const { total_amount, currency, product_ids, product_details, address_id } = req.body;

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
            product_ids: JSON.stringify(product_details.map(item => item.id)), // Store only product IDs as JSON
            total_amount,
            currency,
            address_id,
            payment_id: paymentIntent.id
        });

        await Promise.all(product_details.map(async (product) => {
            await order_details.create({
                user_id: req.user.id,
                order_id: order.id,
                product_id: product.id,
                quantity: product.quantity,
                amount: product.amount,
                size: product.size,
                carat: product.carat,
                weight: product.weight,
                material_type: product.material_type
            });
        }));

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
            const cartRecord = await Cart.findAll({
                where: {
                    user_id: req.user.id,
                }
            });
            if (cartRecord) {
                await Cart.destroy({ where: { user_id :req.user.id} });
            }
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

        const ordersWithDetails = await Promise.all(result.data.map(async (order) => {
            let productIds = [];

            // Parse product_ids if it's a string
            if (typeof order.product_ids === 'string') {
                productIds = JSON.parse(order.product_ids);
            } else {
                productIds = order.product_ids;
            }

            const products = await Promise.all(productIds.map(async (productId) => {
                return await Product.findOne({ where: { id: productId } });
            }));

            // Fetch related order details from the order_details table
            const orderDetails = await order_details.findAll({
                where: { order_id: order.id }
            });

            // Fetch product names for each order_detail entry
            const orderDetailsWithProductNames = await Promise.all(orderDetails.map(async (detail) => {
                const product = await Product.findOne({ where: { id: detail.product_id } });

                return { 
                    ...detail.toJSON(), 
                    productName: product ? product.name : null // Include product name in the response
                };
            }));

            return { 
                ...order.toJSON(), 
                products, 
                orderDetails: orderDetailsWithProductNames 
            };
        }));

        res.status(200).json({ 
            success: true, 
            data: ordersWithDetails, 
            totalItems: result.totalItems, 
            totalPages: result.totalPages 
        });
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

exports.editOrderStatus = async (req, res) => {
    try {
        const { id, order_status } = req.body;

        if (!id || !order_status) {
            return res.status(400).json({ success: false, error: "Order ID and order status are required." });
        }

        // Find the order by ID
        const order = await Order.findOne({ where: { id } });

        if (!order) {
            return res.status(404).json({ success: false, error: "Order not found." });
        }

        // Update the order status
        await Order.update({ status: order_status }, { where: { id } });

        res.status(200).json({ success: true, message: "Order status updated successfully." });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
