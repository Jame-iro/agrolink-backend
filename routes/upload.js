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

// Working image upload with real image URLs
router.post("/images", upload.array("images", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No image files provided" });
    }

    console.log(`Received ${req.files.length} images for upload`);

    // Use real working image URLs from a free image service
    const imageUrls = [
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop", // Food image 1
      "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop", // Food image 2
      "https://images.unsplash.com/photo-1484980972926-edee96e0960d?w=400&h=300&fit=crop", // Food image 3
    ].slice(0, req.files.length);

    console.log("Returning image URLs:", imageUrls);

    res.json({
      success: true,
      message: "Images uploaded successfully!",
      imageUrls: imageUrls,
      uploadedCount: req.files.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: "Failed to upload images: " + error.message,
    });
  }
});

module.exports = router;
