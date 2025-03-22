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
            await Order.update({ status: 'completed' }, { where: { id: orderId } });
            const cartRecord = await Cart.findAll({
                where: {
                    user_id: req.user.id,
                }
            });
            if (cartRecord) {
                await Cart.destroy({ where: { user_id: req.user.id } });
            }
            res.status(200).json({ success: true, message: 'Payment successful and order verified.' });
        } else {
            await Order.update({ status: 'failed' }, { where: { id: orderId } });
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
        const { page = 1, size = 10, status = '' ,startDate, endDate} = req.query;
 
        const whereCondition = {};
        if (status) {
            const normalizedStatus = status.toLowerCase();

            if (['paid', 'unpaid', 'failed'].includes(normalizedStatus)) {
                if (normalizedStatus === 'paid') whereCondition.status = 'completed';
                if (normalizedStatus === 'unpaid') whereCondition.status = 'pending';
                if (normalizedStatus === 'failed') whereCondition.status = 'failed';
            } else {
                whereCondition.order_status = { [Op.like]: `%${status}%` };
            }
        }
        
        if (startDate && endDate) {
            whereCondition.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
        }

        const result = await paginate(Order, page, size, whereCondition);

        const ordersWithProducts = await Promise.all(result.data.map(async (order) => {
            const productIds = JSON.parse(order.product_ids);

            const products = await Promise.all(productIds.map(async (productId) => {
                return await Product.findOne({ where: { id: productId } });
            }));

            const user = await User.findOne({ where: { id: order.user_id } });
            const address = await Address.findOne({ where: { id: order.address_id } });

            const orderDetails = await order_details.findAll({
                where: { order_id: order.id }
            });

            const orderDetailsWithProductNames = await Promise.all(orderDetails.map(async (detail) => {
                const product = await Product.findOne({ where: { id: detail.product_id } });

                return {
                    ...detail.toJSON(),
                    productName: product ? product.name : null, // Include product name in the response
                    productImage: product ? product.images : null

                };
            }));

            

            return {
                ...order.toJSON(),
                products,
                orderDetails: orderDetailsWithProductNames,
                user: user ? user.toJSON() : null,
                address: address ? address.toJSON() : null
            };
        }));

        const [pendingCount, inProcessCount, shippingCount, deliveredCount, 
            canceledCount, paidCount, unpaidCount, failedCount ,all] = await Promise.all([
            Order.count({ where: { order_status: 'pending' } }),
            Order.count({ where: { order_status: 'in_process' } }),
            Order.count({ where: { order_status: 'shipping' } }),
            Order.count({ where: { order_status: 'delivered' } }),
            Order.count({ where: { order_status: 'canceled' } }),
            Order.count({ where: { status: 'completed' } }),
            Order.count({ where: { status: 'pending' } }),
            Order.count({ where: { status: 'failed' } }),
            Order.count()
        ]);

        res.status(200).json({
            success: true,
            data: ordersWithProducts,
            totalItems: result.totalItems,
            totalPages: result.totalPages,
            statusCounts: {
                pending: pendingCount,
                in_process: inProcessCount,
                shipping: shippingCount,
                delivered: deliveredCount,
                canceled: canceledCount,
                paid: paidCount,
                unpaid: unpaidCount,
                failed: failedCount,
                all:all
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


/*
exports.listOrdersAdmin = async (req, res) => {
    try {
        const { page = 1, size = 10, status = '', startDate, endDate, search = '' } = req.query;

        const whereCondition = {};
        
        // Handle status filtering
        if (status) {
            const normalizedStatus = status.toLowerCase();
            if (['paid', 'unpaid', 'failed'].includes(normalizedStatus)) {
                if (normalizedStatus === 'paid') whereCondition.status = 'completed';
                if (normalizedStatus === 'unpaid') whereCondition.status = 'pending';
                if (normalizedStatus === 'failed') whereCondition.status = 'failed';
            } else {
                whereCondition.order_status = { [Op.like]: `%${status}%` };
            }
        }

        // Handle date filtering
        if (startDate && endDate) {
            whereCondition.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
        }

        const result = await paginate(Order, page, size, whereCondition);

        const ordersWithProducts = await Promise.all(result.data.map(async (order) => {
            const productIds = JSON.parse(order.product_ids);

            const products = await Promise.all(productIds.map(async (productId) => {
                return await Product.findOne({ where: { id: productId } });
            }));

            const user = await User.findOne({ where: { id: order.user_id } });
            const address = await Address.findOne({ where: { id: order.address_id } });

            const orderDetails = await order_details.findAll({
                where: { order_id: order.id }
            });

            const orderDetailsWithProductNames = await Promise.all(orderDetails.map(async (detail) => {
                const product = await Product.findOne({ where: { id: detail.product_id } });

                return {
                    ...detail.toJSON(),
                    productName: product ? product.name : null,
                    productImage: product ? product.images : null
                };
            }));

            return {
                ...order.toJSON(),
                products,
                orderDetails: orderDetailsWithProductNames,
                user: user ? user.toJSON() : null,
                address: address ? address.toJSON() : null
            };
        }));

        // 🔍 Apply search filter if 'search' query is provided
        let filteredOrders = ordersWithProducts;
        if (search) {
            filteredOrders = ordersWithProducts.filter(order => 
                JSON.stringify(order).toLowerCase().includes(search.toLowerCase())
            );
        }

        // Count all statuses
        const [pendingCount, inProcessCount, shippingCount, deliveredCount, 
            canceledCount, paidCount, unpaidCount, failedCount ,all] = await Promise.all([
            Order.count({ where: { order_status: 'pending' } }),
            Order.count({ where: { order_status: 'in_process' } }),
            Order.count({ where: { order_status: 'shipping' } }),
            Order.count({ where: { order_status: 'delivered' } }),
            Order.count({ where: { order_status: 'canceled' } }),
            Order.count({ where: { status: 'completed' } }),
            Order.count({ where: { status: 'pending' } }),
            Order.count({ where: { status: 'failed' } }),
            Order.count()
        ]);

        res.status(200).json({
            success: true,
            data: filteredOrders,
            totalItems: filteredOrders.length,
            totalPages: Math.ceil(filteredOrders.length / size),
            statusCounts: {
                pending: pendingCount,
                in_process: inProcessCount,
                shipping: shippingCount,
                delivered: deliveredCount,
                canceled: canceledCount,
                paid: paidCount,
                unpaid: unpaidCount,
                failed: failedCount,
                all: all
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

*/

exports.editOrderStatus = async (req, res) => {
    try {
        const { id, order_status } = req.body;

        if (!id || !order_status) {
            return res.status(400).json({ success: false, error: "Order ID(s) and order status are required." });
        }

        // Check if id is an array or a single value
        const whereCondition = Array.isArray(id) ? { id: { [Op.in]: id } } : { id };

        // Find orders by IDs
        const orders = await Order.findAll({ where: whereCondition });

        if (orders.length === 0) {
            return res.status(404).json({ success: false, error: "No orders found with the provided ID(s)." });
        }

        // Update the order status for all matching orders
        await Order.update({ order_status: order_status }, { where: whereCondition });

        res.status(200).json({ success: true, message: "Order status updated successfully." });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

