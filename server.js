const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
require("dotenv").config();

// Import models and routes
require("./models/User");
require("./models/Product");
require("./models/Order");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

app.post("/api/upload/images", (req, res) => {
  console.log("Upload endpoint called");
  res.json({
    success: true,
    message: "Upload endpoint is working!",
    images: [
      "https://via.placeholder.com/400x300/00ff00/ffffff?text=Test+Image+1",
      "https://via.placeholder.com/400x300/0000ff/ffffff?text=Test+Image+2",
    ],
  });
});

app.post("/api/upload/image", (req, res) => {
  console.log("Single image upload endpoint called");
  res.json({
    success: true,
    message: "Single image upload is working!",
    imageUrl:
      "https://via.placeholder.com/400x300/ff0000/ffffff?text=Test+Image",
  });
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/upload", require("./routes/upload"));

// Health check
app.get("/", (req, res) => {
  res.json({ message: "AgriLink API is running!" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
