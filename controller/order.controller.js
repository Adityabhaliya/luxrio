const Category = require('../schema/category.schema');
const slugify = require('slugify');
const { paginate } = require('../utils/common');
const { Op } = require('sequelize');
const { Setting, Product, User, Address, order_details, ratingSchema } = require('../schema');
const Order = require('../schema/order.schema');
const Cart = require('../schema/cart.schema');
const stripe = require('stripe')('sk_test_51R0hP8DPYqiRFj9aK46wcnApxCkAe8UMXSzPyVdIUfONAOI5pxAEJmkVU10y1665fXUuMcWBctdmGKj5lnINODhD005MwChyhy');
const axios = require('axios');
const PDFDocument = require('pdfkit');
const fs = require('fs');

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
            product_ids: product_details.map(item => item.id), // Store as an actual array
            total_amount,
            currency,
            address_id,
            payment_id: paymentIntent.id
        });

        const generatedOrderId = `order_${order.id}`;

        // Update the order with the generated order_id
        await Order.update({ order_id: generatedOrderId }, { where: { id: order.id } });

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

            const rating = await ratingSchema.findOne({
                where: {
                  order_id: order.id,
                  user_id  
                }
              });

            return {
                ...order.toJSON(),
                products,
                orderDetails: orderDetailsWithProductNames,
                is_rating_id: rating ? rating.id : null // ✅ Add rating ID if exists

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




// exports.listOrdersAdmin = async (req, res) => {
//     try {
//         const { page = 1, size = 10, status = '',search ,startDate, endDate} = req.query;

//         const whereCondition = {};
//         if (status) {
//             const normalizedStatus = status.toLowerCase();

//             if (['paid', 'unpaid', 'failed'].includes(normalizedStatus)) {
//                 if (normalizedStatus === 'paid') whereCondition.status = 'completed';
//                 if (normalizedStatus === 'unpaid') whereCondition.status = 'pending';
//                 if (normalizedStatus === 'failed') whereCondition.status = 'failed';
//             } else {
//                 whereCondition.order_status = { [Op.like]: `%${status}%` };
//             }
//         }

//         if (startDate && endDate) {
//             whereCondition.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
//         }

//         const result = await paginate(Order, page, size, whereCondition);

//         const ordersWithProducts = await Promise.all(result.data.map(async (order) => {
//             const productIds = JSON.parse(order.product_ids);

//             const products = await Promise.all(productIds.map(async (productId) => {
//                 return await Product.findOne({ where: { id: productId } });
//             }));

//             const user = await User.findOne({ where: { id: order.user_id } });
//             const address = await Address.findOne({ where: { id: order.address_id } });

//             const orderDetails = await order_details.findAll({
//                 where: { order_id: order.id }
//             });

//             const orderDetailsWithProductNames = await Promise.all(orderDetails.map(async (detail) => {
//                 const product = await Product.findOne({ where: { id: detail.product_id } });

//                 return {
//                     ...detail.toJSON(),
//                     productName: product ? product.name : null, // Include product name in the response
//                     productImage: product ? product.images : null

//                 };
//             }));



//             return {
//                 ...order.toJSON(),
//                 products,
//                 orderDetails: orderDetailsWithProductNames,
//                 user: user ? user.toJSON() : null,
//                 address: address ? address.toJSON() : null
//             };
//         }));

//         const [pendingCount, inProcessCount, shippingCount, deliveredCount, 
//             canceledCount, paidCount, unpaidCount, failedCount ,all] = await Promise.all([
//             Order.count({ where: { order_status: 'pending' } }),
//             Order.count({ where: { order_status: 'in_process' } }),
//             Order.count({ where: { order_status: 'shipping' } }),
//             Order.count({ where: { order_status: 'delivered' } }),
//             Order.count({ where: { order_status: 'canceled' } }),
//             Order.count({ where: { status: 'completed' } }),
//             Order.count({ where: { status: 'pending' } }),
//             Order.count({ where: { status: 'failed' } }),
//             Order.count()
//         ]);

//         res.status(200).json({
//             success: true,
//             data: ordersWithProducts,
//             totalItems: result.totalItems,
//             totalPages: result.totalPages,
//             statusCounts: {
//                 pending: pendingCount,
//                 in_process: inProcessCount,
//                 shipping: shippingCount,
//                 delivered: deliveredCount,
//                 canceled: canceledCount,
//                 paid: paidCount,
//                 unpaid: unpaidCount,
//                 failed: failedCount,
//                 all:all
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ success: false, error: error.message });
//     }
// };


exports.listOrdersAdmin = async (req, res) => {
    try {
        const { page = 1, size = 10, status = '', s = '', startDate, endDate } = req.query;

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
                    productName: product ? product.name : null,
                    productImage: product ? product.images : null
                };
            }));

            const fullOrderData = {
                ...order.toJSON(),
                products,
                orderDetails: orderDetailsWithProductNames,
                user: user ? user.toJSON() : null,
                address: address ? address.toJSON() : null
            };

            return fullOrderData;
        }));

        // Filter results by search term if provided
        const filteredOrders = s ? ordersWithProducts.filter(order => {
            const orderString = JSON.stringify(order).toLowerCase();
            return orderString.includes(s.toLowerCase());
        }) : ordersWithProducts;

        const [pendingCount, inProcessCount, shippingCount, deliveredCount,
            canceledCount, paidCount, unpaidCount, failedCount, all] = await Promise.all([
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


  
exports.getOrderDetailsPdf = async (req, res) => {
    try {
      const { order_id } = req.params;
  
      // 1. Get all order details for the order_id
      const orders = await order_details.findAll({ where: { order_id } });
  
      if (!orders.length) {
        return res.status(404).json({ success: false, message: "No orders found for this ID" });
      }
  
      // 2. Extract product_ids (in case it's a JSON array or single value)
      const productIds = [...new Set(orders.map(order => order.product_id).flat())];
  
      // 3. Find product names
      const products = await Product.findAll({
        where: { id: productIds },
        attributes: ['id', 'name']
      });
  
      const productMap = {};
      products.forEach(p => {
        productMap[p.id] = p.name;
      });
  
      // 4. Enrich order details with product names
      const enrichedOrders = orders.map(order => ({
        ...order.toJSON(),
        product_name: productMap[order.product_id] || 'N/A'
      }));
  
      // 5. Generate PDF
      const doc = new PDFDocument();
      
      // Set response headers for automatic download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="order_${order_id}.pdf"`);
      
      // Pipe the PDF directly to the response
      doc.pipe(res);
  
      doc.fontSize(18).text(`Order Report - Order ID: ${orders.order_id}`, { underline: true });
      doc.moveDown();
  
      enrichedOrders.forEach((order, index) => {
        doc.fontSize(12).text(
          `#${index + 1}
          Product: ${order.product_name}
          Quantity: ${order.quantity}
          Amount: ${order.amount}
          Size: ${order.size}
          Carat: ${order.carat}
          Material: ${order.material_type}
          Weight: ${order.weight}
          `
        );
        doc.moveDown();
      });
  
      doc.end();
    } catch (error) {
      console.error("PDF generation error:", error);
      return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
  };

  exports.AdmingetOrderDetailsPdf = async (req, res) => {
    try {
      const { order_id } = req.params;
      
      // Split comma-separated order IDs into an array
      const orderIds = order_id.split(',').map(id => id.trim());
  
      // 1. Get all order details for all order_ids
      const orders = await order_details.findAll({ 
        where: { 
          order_id: orderIds 
        },
        order: [['order_id', 'ASC']] // Optional: sort by order_id
      });
  
      if (!orders.length) {
        return res.status(404).json({ success: false, message: "No orders found for these IDs" });
      }
  
      // 2. Extract product_ids (in case it's a JSON array or single value)
      const productIds = [...new Set(orders.map(order => order.product_id).flat())];
  
      // 3. Find product names
      const products = await Product.findAll({
        where: { id: productIds },
        attributes: ['id', 'name']
      });
  
      const productMap = {};
      products.forEach(p => {
        productMap[p.id] = p.name;
      });
  
      // 4. Enrich order details with product names and group by order_id
      const ordersByOrderId = {};
      orders.forEach(order => {
        const enrichedOrder = {
          ...order.toJSON(),
          product_name: productMap[order.product_id] || 'N/A'
        };
        
        if (!ordersByOrderId[order.order_id]) {
          ordersByOrderId[order.order_id] = [];
        }
        ordersByOrderId[order.order_id].push(enrichedOrder);
      });
  
      // 5. Generate PDF
      const doc = new PDFDocument();
      
      // Set response headers for automatic download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="orders_${orderIds.join('_')}.pdf"`);
      
      // Pipe the PDF directly to the response
      doc.pipe(res);
  
      // Add title
      doc.fontSize(18).text(`Order Report${orderIds.length > 1 ? 's' : ''}`, { underline: true });
      doc.moveDown();
  
      // Loop through each order group
      Object.entries(ordersByOrderId).forEach(([currentOrderId, orderItems]) => {
        doc.fontSize(14).text(`Order ID: ${currentOrderId}`, { underline: true });
        doc.moveDown();
  
        // List all items in this order
        orderItems.forEach((order, index) => {
          doc.fontSize(12).text(
            `Item #${index + 1}
            Product: ${order.product_name}
            Quantity: ${order.quantity}
            Amount: ${order.amount}
            Size: ${order.size}
            Carat: ${order.carat}
            Material: ${order.material_type}
            Weight: ${order.weight}
            `, 
            { paragraphGap: 5 }
          );
          doc.moveDown();
        });
  
        // Add some space between different orders if multiple
        if (orderIds.length > 1) {
          doc.moveDown();
          doc.moveDown();
        }
      });
  
      doc.end();
    } catch (error) {
      console.error("PDF generation error:", error);
      return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
  };