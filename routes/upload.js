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

// Temporary working upload route
router.post("/images", upload.array("images", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No image files provided" });
    }

    console.log(`Received ${req.files.length} images`);

    // Return placeholder URLs
    const imageUrls = req.files.map(
      (file, index) =>
        `https://via.placeholder.com/400x300/${Math.floor(
          Math.random() * 16777215
        )
          .toString(16)
          .padStart(6, "0")}/ffffff?text=Image+${index + 1}`
    );

    res.json({
      success: true,
      message: "Images uploaded successfully!",
      imageUrls: imageUrls,
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
      imageUrl: `https://via.placeholder.com/400x300/ff0000/ffffff?text=Product+Image`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: "Failed to upload image: " + error.message,
    });
  }
});

module.exports = router;
