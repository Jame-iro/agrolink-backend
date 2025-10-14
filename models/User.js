const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    telegramId: {
      type: Number,
      required: true,
      unique: true, // This creates an index automatically
      index: true, // Remove this line to avoid duplicate
    },
    firstName: {
      type: String,
      required: true,
    },
    username: String,
    role: {
      type: String,
      enum: ["farmer", "consumer"],
      required: true,
    },
    location: String,
    phoneNumber: String,
    farmName: String,
    farmDescription: String,
    deliveryAddress: String,
  },
  {
    timestamps: true,
  }
);

// userSchema.index({ telegramId: 1 }); 

module.exports = mongoose.model("User", userSchema);
