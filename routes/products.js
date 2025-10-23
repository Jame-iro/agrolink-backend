// routes/products.js
const express = require("express");
const Product = require("../models/Product");
const router = express.Router();

// Get all products
router.get("/", async (req, res) => {
  try {
    const { category, farmerId, search } = req.query;
    let query = { isAvailable: true };

    if (category) query.category = category;
    if (farmerId) query.farmerTelegramId = parseInt(farmerId);
    if (search) {
      query.$text = { $search: search };
    }

    const products = await Product.find(query)
      .populate("farmerId", "firstName username farmName")
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get single product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "farmerId",
      "firstName username farmName location"
    );

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Create new product
router.post("/", async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();

    // Populate farmer info before sending response
    await product.populate("farmerId", "firstName username farmName");

    res.status(201).json(product);
  } catch (error) {
    console.error("Create product error:", error);
    res.status(400).json({ error: "Failed to create product" });
  }
});

// Update product
router.put("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate("farmerId", "firstName username farmName");

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Update product error:", error);
    res.status(400).json({ error: "Failed to update product" });
  }
});

// Delete product
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// Create new product
router.post("/", async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();

    // Populate farmer info before sending response
    await product.populate("farmerId", "firstName username");

    res.status(201).json(product);
  } catch (error) {
    console.error("Create product error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ error: errors.join(", ") });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "Product with this name already exists" });
    }

    res.status(400).json({ error: "Failed to create product" });
  }
});
module.exports = router;
