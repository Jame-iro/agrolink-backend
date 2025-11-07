const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Upload image to ImgBB
router.post("/image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    // Convert buffer to base64
    const base64Image = req.file.buffer.toString("base64");

    // Upload to ImgBB
    const formData = new FormData();
    formData.append("image", base64Image);

    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    if (response.data.success) {
      res.json({
        success: true,
        imageUrl: response.data.data.url,
        deleteUrl: response.data.data.delete_url,
      });
    } else {
      throw new Error("ImgBB upload failed");
    }
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// Upload multiple images
router.post("/images", upload.array("images", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No image files provided" });
    }

    const uploadPromises = req.files.map(async (file) => {
      const base64Image = file.buffer.toString("base64");
      const formData = new FormData();
      formData.append("image", base64Image);

      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        }
      );

      return response.data.success ? response.data.data.url : null;
    });

    const imageUrls = (await Promise.all(uploadPromises)).filter(
      (url) => url !== null
    );

    res.json({
      success: true,
      imageUrls: imageUrls,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload images" });
  }
});

module.exports = router;
