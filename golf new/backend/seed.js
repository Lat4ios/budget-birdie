const mongoose = require('mongoose');
require('dotenv').config();

// Product Schema
const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  imageUrl: String,
  category: String,
  inStock: { type: Boolean, default: true },
  stockQuantity: { type: Number, default: 10 }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

const sampleProducts = [
  {
    name: 'Premium Golf Balls (12 Pack)',
    description: 'Tour-quality golf balls with exceptional distance and spin control. Perfect for players of all levels.',
    price: 39.99,
    imageUrl: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400',
    category: 'balls',
    inStock: true,
    stockQuantity: 50
  },
  {
    name: 'Performance Golf Polo',
    description: 'Moisture-wicking, UV-protection fabric keeps you comfortable all day on the course.',
    price: 59.99,
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400',
    category: 'apparel',
    inStock: true,
    stockQuantity: 30
  },
  {
    name: 'Pro Golf Glove',
    description: 'Premium cabretta leather glove for superior feel and grip.',
    price: 24.99,
    imageUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400',
    category: 'accessories',
    inStock: true,
    stockQuantity: 100
  },
  {
    name: 'Distance Golf Balls (24 Pack)',
    description: 'Maximum distance off the tee with durable construction for long-lasting play.',
    price: 49.99,
    imageUrl: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400',
    category: 'balls',
    inStock: true,
    stockQuantity: 25
  },
  {
    name: 'Golf Cap',
    description: 'Adjustable, breathable cap with UV protection. Perfect for sunny days.',
    price: 29.99,
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400',
    category: 'apparel',
    inStock: true,
    stockQuantity: 75
  },
  {
    name: 'Golf Towel',
    description: 'Large, absorbent microfiber towel with clip for easy attachment to your bag.',
    price: 14.99,
    imageUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400',
    category: 'accessories',
    inStock: true,
    stockQuantity: 200
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/golfstore');
    console.log('✅ Connected to MongoDB');
    
    // Clear existing products
    await Product.deleteMany();
    console.log('🗑️  Cleared existing products');
    
    // Insert sample products
    await Product.insertMany(sampleProducts);
    console.log(`✅ Added ${sampleProducts.length} products to database`);
    
    console.log('\n📦 Products added:');
    sampleProducts.forEach(p => console.log(`   - ${p.name} ($${p.price})`));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();