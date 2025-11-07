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

// REAL ImgBB image upload
router.post("/images", upload.array("images", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No image files provided" });
    }

    // Check if ImgBB API key is configured
    if (!process.env.IMGBB_API_KEY) {
      return res.status(500).json({
        error: "ImgBB API key not configured. Using demo mode.",
        imageUrls: [
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
          "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop",
        ].slice(0, req.files.length),
        demo: true,
      });
    }

    console.log(`Uploading ${req.files.length} images to ImgBB...`);

    const uploadPromises = req.files.map(async (file) => {
      try {
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
            timeout: 30000,
          }
        );

        if (response.data.success) {
          console.log("ImgBB upload success:", response.data.data.url);
          return response.data.data.url;
        } else {
          console.error("ImgBB upload failed:", response.data.error);
          return null;
        }
      } catch (error) {
        console.error("Single image upload failed:", error.message);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter((url) => url !== null);

    if (successfulUploads.length === 0) {
      return res.json({
        success: true,
        message: "Using demo images (ImgBB upload failed)",
        imageUrls: [
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
          "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop",
        ].slice(0, req.files.length),
        demo: true,
      });
    }

    res.json({
      success: true,
      message: "Images uploaded to ImgBB successfully!",
      imageUrls: successfulUploads,
      uploadedCount: successfulUploads.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.json({
      success: true,
      message: "Using demo images due to upload error",
      imageUrls: [
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop",
      ].slice(0, req.files?.length || 1),
      demo: true,
      error: error.message,
    });
  }
});

module.exports = router;
