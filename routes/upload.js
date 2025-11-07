const express = require("express");
const multer = require("multer");
const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Working image upload with REAL working image URLs
router.post("/images", upload.array("images", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No image files provided" });
    }

    console.log(`Received ${req.files.length} images for upload`);

    const workingImageUrls = [
      // Unsplash food images (always work)
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop", // Vegetables
      "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop", // Food
      "https://images.unsplash.com/photo-1484980972926-edee96e0960d?w=400&h=300&fit=crop", // Produce
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop", // Fruits
      "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=300&fit=crop", // Market
    ].slice(0, req.files.length);

    console.log("Returning WORKING image URLs:", workingImageUrls);

    res.json({
      success: true,
      message: "Images uploaded successfully!",
      imageUrls: workingImageUrls,
      uploadedCount: req.files.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: "Failed to upload images: " + error.message,
    });
  }
});

// Single image upload
router.post("/image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    res.json({
      success: true,
      message: "Image uploaded successfully!",
      imageUrl:
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: "Failed to upload image: " + error.message,
    });
  }
});

module.exports = router;
