const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  imageUrl: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    enum: ['balls', 'apparel', 'accessories'], 
    required: true 
  },
  inStock: { 
    type: Boolean, 
    default: true 
  },
  stockQuantity: { 
    type: Number, 
    default: 0,
    min: 0
  },
  featured: { 
    type: Boolean, 
    default: false 
  },
  discount: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 100
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);