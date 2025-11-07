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

// Upload single image to ImgBB
router.post("/image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    console.log("Uploading image to ImgBB...");

    // Convert buffer to base64
    const base64Image = req.file.buffer.toString("base64");

    // Create form data for ImgBB
    const formData = new FormData();
    formData.append("image", base64Image);

    // Upload to ImgBB
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

    console.log("ImgBB response:", response.data);

    if (response.data.success) {
      res.json({
        success: true,
        imageUrl: response.data.data.url,
        thumbUrl: response.data.data.thumb.url, 
        deleteUrl: response.data.data.delete_url,
      });
    } else {
      throw new Error("ImgBB upload failed: " + response.data.error.message);
    }
  } catch (error) {
    console.error("Upload error:", error.response?.data || error.message);
    res.status(500).json({
      error:
        "Failed to upload image: " +
        (error.response?.data?.error?.message || error.message),
    });
  }
});

// Upload multiple images to ImgBB
router.post("/images", upload.array("images", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No image files provided" });
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

        return response.data.success
          ? {
              url: response.data.data.url,
              thumbUrl: response.data.data.thumb.url,
              deleteUrl: response.data.data.delete_url,
            }
          : null;
      } catch (error) {
        console.error("Single image upload failed:", error.message);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter((result) => result !== null);

    res.json({
      success: true,
      uploaded: successfulUploads.length,
      failed: req.files.length - successfulUploads.length,
      images: successfulUploads,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: "Failed to upload images: " + error.message,
    });
  }
});

module.exports = router;
