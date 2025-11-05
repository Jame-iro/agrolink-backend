// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  farmerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  farmerTelegramId: { 
    type: Number, 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  description: String,
  price: { 
    type: Number, 
    required: true 
  },
  category: { 
    type: String, 
    required: true 
  },
  images: [String],
  stock: { 
    type: Number, 
    default: 0 
  },
  isAvailable: { 
    type: Boolean, 
    default: true 
  },
  location: String,
  tags: [String]
}, {
  timestamps: true
});

// Create indexes for better performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isAvailable: 1 });
productSchema.index({ farmerTelegramId: 1 });

module.exports = mongoose.model('Product', productSchema);