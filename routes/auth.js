const express = require("express");
const crypto = require("crypto");
const User = require("../models/User");
const router = express.Router();

// Telegram authentication
router.post("/telegram", async (req, res) => {
  try {
    const { initData } = req.body;

    if (!initData) {
      return res.status(400).json({ error: "No init data provided" });
    }

    // Validate Telegram data
    const isValid = validateTelegramData(
      initData,
      process.env.TELEGRAM_BOT_TOKEN
    );

    if (!isValid) {
      return res.status(401).json({ error: "Invalid Telegram data" });
    }

    // Parse user data from initData
    const params = new URLSearchParams(initData);
    const userStr = params.get("user");

    if (!userStr) {
      return res.status(400).json({ error: "No user data in init data" });
    }

    const telegramUser = JSON.parse(userStr);

    // Find or create user
    let user = await User.findOne({ telegramId: telegramUser.id });

    if (!user) {
      user = new User({
        telegramId: telegramUser.id,
        firstName: telegramUser.first_name,
        username: telegramUser.username,
        role: "consumer",
      });
    } else {
      // Update user data
      user.firstName = telegramUser.first_name;
      user.username = telegramUser.username;
    }

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        telegramId: user.telegramId,
        first_name: user.firstName,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
});

// Update user role
router.put("/role", async (req, res) => {
  try {
    const { telegramId, role } = req.body;

    if (!["farmer", "consumer"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const user = await User.findOneAndUpdate(
      { telegramId },
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Role update error:", error);
    res.status(500).json({ error: "Failed to update role" });
  }
});

// Telegram data validation function
function validateTelegramData(initData, botToken) {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");

    if (!hash) {
      return false;
    }

    // Remove hash and sort remaining parameters
    params.delete("hash");

    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    // Create secret key
    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    // Calculate hash
    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    return calculatedHash === hash;
  } catch (error) {
    console.error("Telegram validation error:", error);
    return false;
  }
}

module.exports = router;
