// server.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/database");
require("dotenv").config();

// Import models (this ensures they're registered with mongoose)
require("./models/User");
require("./models/Product");
require('./models/Order');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use('/api/orders', require('./routes/orders'));

// Basic health check route
app.get("/", (req, res) => {
  res.json({
    message: "AgriLink API is running!",
    database:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  });
});

// Test database connection route
app.get("/api/test-db", async (req, res) => {
  try {
    const User = mongoose.model("User");
    const userCount = await User.countDocuments();
    res.json({
      message: "Database is working!",
      userCount: userCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 6969;

// Connect to MongoDB first, then start the server
const startServer = async () => {
  try {
    await connectDB();
    console.log("MongoDB connection established");

    app.listen(PORT, () => {
      console.log(`AgriLink server running on port ${PORT}`);
      console.log(
        `MongoDB connected: ${
          mongoose.connection.readyState === 1 ? "Yes" : "No"
        }`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
