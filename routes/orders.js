// routes/orders.js
const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const router = express.Router();

// Create a new order
router.post("/", async (req, res) => {
  try {
    const {
      consumerId,
      items,
      deliveryAddress,
      customerPhone,
      customerNotes,
      paymentMethod,
    } = req.body;

    console.log("Received order creation request:", {
      consumerId,
      consumerIdType: typeof consumerId,
      itemsCount: items?.length,
      deliveryAddress,
      paymentMethod,
    });

    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ error: "Order must contain at least one item" });
    }

    // Validate consumer exists - handle both number and string IDs
    let consumer;

    // If consumerId is a number (telegramId)
    if (typeof consumerId === "number" || !isNaN(consumerId)) {
      const numericId = Number(consumerId);
      consumer = await User.findOne({ telegramId: numericId });
      console.log(`Looking for consumer with telegramId: ${numericId}`);
    }
    // If consumerId is a string (could be MongoDB ObjectId)
    else if (typeof consumerId === "string") {
      // Check if it's a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(consumerId)) {
        consumer = await User.findById(consumerId);
        console.log(`Looking for consumer with ObjectId: ${consumerId}`);
      } else {
        // Try as telegramId string that can be converted to number
        const numericId = Number(consumerId);
        if (!isNaN(numericId)) {
          consumer = await User.findOne({ telegramId: numericId });
          console.log(
            `Looking for consumer with telegramId (from string): ${numericId}`
          );
        }
      }
    }

    console.log("Found consumer:", consumer);

    if (!consumer) {
      return res.status(404).json({
        error: "Consumer not found. Please make sure you are logged in.",
      });
    }

    // Calculate total and validate products
    let totalAmount = 0;
    const orderItems = [];
    let farmerId = null;

    for (const item of items) {
      let product;
      if (mongoose.Types.ObjectId.isValid(item.productId)) {
        product = await Product.findById(item.productId);
      } else {
        return res.status(400).json({ error: "Invalid product ID format" });
      }

      if (!product) {
        return res
          .status(404)
          .json({ error: `Product not found: ${item.productId}` });
      }

      if (!product.isAvailable) {
        return res
          .status(400)
          .json({ error: `Product not available: ${product.name}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for: ${product.name}. Available: ${product.stock}`,
        });
      }

      // Set farmerId from the first product (assuming all products from same farmer)
      if (!farmerId) {
        farmerId = product.farmerId;
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        image: product.images[0] || null,
      });

      // Update product stock
      product.stock -= item.quantity;
      if (product.stock === 0) {
        product.isAvailable = false;
      }
      await product.save();
    }

    // Create the order
    const order = new Order({
      consumerId: consumer._id,
      farmerId: farmerId,
      items: orderItems,
      totalAmount,
      deliveryAddress: deliveryAddress || consumer.deliveryAddress,
      customerPhone: customerPhone,
      customerNotes: customerNotes,
      paymentMethod: paymentMethod || "cash",
      status: "pending",
    });

    await order.save();

    // Populate the order with consumer and farmer details
    await order.populate("consumerId", "firstName username telegramId");
    await order.populate("farmerId", "firstName username farmName telegramId");

    console.log("Order created successfully:", order._id);

    res.status(201).json({
      ...order.toObject(),
      message: "Order created successfully",
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ error: "Failed to create order: " + error.message });
  }
});

// Get orders for a consumer (by telegramId or ObjectId)
router.get("/consumer/:id", async (req, res) => {
  try {
    let consumer;

    // Check if the ID is a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      consumer = await User.findById(req.params.id);
    } else {
      // If not ObjectId, treat as telegramId
      consumer = await User.findOne({ telegramId: parseInt(req.params.id) });
    }

    if (!consumer) {
      return res.status(404).json({ error: "Consumer not found" });
    }

    const orders = await Order.find({ consumerId: consumer._id })
      .populate("consumerId", "firstName username telegramId")
      .populate("farmerId", "firstName username farmName telegramId")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Get consumer orders error:", error);
    res.status(500).json({ error: "Failed to fetch orders: " + error.message });
  }
});

// Get orders for a farmer (by telegramId or ObjectId)
router.get("/farmer/:id", async (req, res) => {
  try {
    let farmer;

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      farmer = await User.findById(req.params.id);
    } else {
      farmer = await User.findOne({ telegramId: parseInt(req.params.id) });
    }

    if (!farmer) {
      return res.status(404).json({ error: "Farmer not found" });
    }

    const orders = await Order.find({ farmerId: farmer._id })
      .populate("consumerId", "firstName username deliveryAddress telegramId")
      .populate("farmerId", "firstName username farmName telegramId")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Get farmer orders error:", error);
    res.status(500).json({ error: "Failed to fetch orders: " + error.message });
  }
});

// Get single order
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate(
        "consumerId",
        "firstName username deliveryAddress phoneNumber telegramId"
      )
      .populate(
        "farmerId",
        "firstName username farmName location phoneNumber telegramId"
      );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ error: "Failed to fetch order: " + error.message });
  }
});

// Update order status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    )
      .populate("consumerId", "firstName username telegramId")
      .populate("farmerId", "firstName username farmName telegramId");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // If order is cancelled, restore product stock
    if (status === "cancelled") {
      await restoreProductStock(order.items);
    }

    res.json({
      ...order.toObject(),
      message: `Order status updated to ${status}`,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res
      .status(500)
      .json({ error: "Failed to update order status: " + error.message });
  }
});

// Helper function to restore product stock when order is cancelled
async function restoreProductStock(items) {
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (product) {
      product.stock += item.quantity;
      product.isAvailable = true;
      await product.save();
    }
  }
}

module.exports = router;
