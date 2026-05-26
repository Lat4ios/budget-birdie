require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const app = express();

// CORS - Allow your frontend
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());

// MongoDB Atlas Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://budgerbirdie:Jcthekid1.@budgetbirdie.ouuesqs.mongodb.net/golfstore?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas!');
    console.log('Database:', mongoose.connection.name);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
  });

// ========== SCHEMAS ==========

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin'], default: 'admin' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  category: { type: String, enum: ['balls', 'apparel', 'accessories'], required: true },
  inStock: { type: Boolean, default: true },
  stockQuantity: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  discount: { type: Number, default: 0 }
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  orderNumber: { type: Number, required: true },
  zipCode: { type: String, required: true },
  customer: {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    province: { type: String, required: true },
    zipCode: { type: String, required: true },
    notes: { type: String, default: '' }
  },
  items: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    imageUrl: { type: String }
  }],
  orderSummary: {
    subtotal: { type: Number, required: true },
    total: { type: Number, required: true }
  },
  paymentMethod: { type: String, required: true },
  status: { type: String, default: 'Pending' },
  orderDate: { type: Date, default: Date.now }
});

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

const adminCodeSchema = new mongoose.Schema({
  code: { type: String, required: true },
  generatedBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 }
});

const Admin = mongoose.model('Admin', adminSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const Counter = mongoose.model('Counter', counterSchema);
const AdminCode = mongoose.model('AdminCode', adminCodeSchema);

// ========== HELPER FUNCTIONS ==========

async function generateOrderId(zipCode) {
  const counter = await Counter.findByIdAndUpdate(
    zipCode,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const orderNumber = counter.seq.toString().padStart(5, '0');
  return { orderId: `${zipCode}-${orderNumber}`, orderNumber: counter.seq };
}

function generateCode() {
  return crypto.randomInt(100000, 999999).toString();
}

async function initProducts() {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany([
        { name: 'Premium Golf Balls (12 Pack)', description: 'Tour-quality golf balls with exceptional distance and spin control.', price: 2299, imageUrl: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400', category: 'balls', stockQuantity: 50 },
        { name: 'Performance Golf Polo', description: 'Moisture-wicking, UV-protection fabric keeps you comfortable all day.', price: 3499, imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400', category: 'apparel', stockQuantity: 30 },
        { name: 'Pro Golf Glove', description: 'Premium cabretta leather glove for superior feel and grip.', price: 1499, imageUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400', category: 'accessories', stockQuantity: 100 }
      ]);
      console.log('✅ Added default products');
    }
  } catch (error) {
    console.error('Error initializing products:', error);
  }
}

// ========== ROUTES ==========

app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/admin/create', async (req, res) => {
  try {
    const { username, password, email, fullName } = req.body;
    const existing = await Admin.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const admin = new Admin({ username, password: hashed, email, fullName, role: 'admin' });
    await admin.save();
    res.json({ message: 'Admin created successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
    admin.lastLogin = new Date();
    await admin.save();
    res.json({ message: 'Login successful', admin: { _id: admin._id, username: admin.username, email: admin.email, fullName: admin.fullName, role: admin.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/setup', async (req, res) => {
  try {
    const { username, password, email, fullName } = req.body;
    const count = await Admin.countDocuments();
    if (count > 0) return res.status(400).json({ message: 'Admin already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const admin = new Admin({ username, password: hashed, email, fullName, role: 'superadmin' });
    await admin.save();
    res.json({ message: 'Superadmin created successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/place-order', async (req, res) => {
  try {
    const { customer, orderItems, total, paymentMethod } = req.body;
    const { orderId, orderNumber } = await generateOrderId(customer.zipCode);
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const order = new Order({
      orderId, orderNumber, zipCode: customer.zipCode,
      customer: {
        fullName: customer.fullName, email: customer.email, phone: customer.phone,
        address: customer.address, city: customer.city, province: customer.province,
        zipCode: customer.zipCode, notes: customer.notes || ''
      },
      items: orderItems,
      orderSummary: { subtotal, total },
      paymentMethod
    });
    await order.save();
    res.json({ success: true, orderId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ orderDate: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 8080;

app.listen(PORT, async () => {
  await initProducts();
  const adminCount = await Admin.countDocuments();
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`✅ MongoDB Atlas: ${mongoose.connection.name || 'connected'}`);
  console.log(`👥 Admins: ${adminCount}`);
});
