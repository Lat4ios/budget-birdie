const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/golfstore')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ========== SCHEMAS ==========

// Admin Schema
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

// Product Schema
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

// Order Schema
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

// Counter Schema for order numbers
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

// Admin Code Schema (expires in 5 minutes)
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
  const count = await Product.countDocuments();
  if (count === 0) {
    await Product.insertMany([
      { name: 'Premium Golf Balls (12 Pack)', description: 'Tour-quality golf balls with exceptional distance and spin control.', price: 2299, imageUrl: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400', category: 'balls', stockQuantity: 50 },
      { name: 'Performance Golf Polo', description: 'Moisture-wicking, UV-protection fabric keeps you comfortable all day.', price: 3499, imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400', category: 'apparel', stockQuantity: 30 },
      { name: 'Pro Golf Glove', description: 'Premium cabretta leather glove for superior feel and grip.', price: 1499, imageUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400', category: 'accessories', stockQuantity: 100 }
    ]);
    console.log('✅ Added default products');
  }
}

// ========== ADMIN AUTH ROUTES ==========

// Check if any admin exists
app.get('/api/admin/check', async (req, res) => {
  const count = await Admin.countDocuments();
  res.json({ hasAdmin: count > 0 });
});

// First time setup - creates superadmin
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

// Login
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

// Change password
app.post('/api/admin/change-password', async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    
    const valid = await bcrypt.compare(oldPassword, admin.password);
    if (!valid) return res.status(401).json({ message: 'Current password incorrect' });
    
    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new admin (for regular signup) - ADD THIS ROUTE
app.post('/api/admin/create', async (req, res) => {
  try {
    const { username, password, email, fullName, createdBy } = req.body;
    
    // Check if admin already exists
    const existing = await Admin.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    const admin = new Admin({ 
      username, 
      password: hashed, 
      email, 
      fullName, 
      role: 'admin',
      createdBy: createdBy || 'system'
    });
    await admin.save();
    
    res.json({ message: 'Admin created successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Generate code for new admin (superadmin only)
app.post('/api/admin/generate-code', async (req, res) => {
  try {
    const { adminId } = req.body;
    const admin = await Admin.findById(adminId);
    if (!admin || admin.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only superadmin can generate codes' });
    }
    
    // Delete old codes
    await AdminCode.deleteMany({ generatedBy: admin.username });
    
    const newCode = generateCode();
    const adminCode = new AdminCode({ code: newCode, generatedBy: admin.username });
    await adminCode.save();
    
    res.json({ code: newCode, expiresIn: 300 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new admin with code
app.post('/api/admin/create-with-code', async (req, res) => {
  try {
    const { code, username, password, email, fullName } = req.body;
    
    const validCode = await AdminCode.findOne({ code });
    if (!validCode) return res.status(401).json({ message: 'Invalid or expired code' });
    
    const existing = await Admin.findOne({ $or: [{ username }, { email }] });
    if (existing) return res.status(400).json({ message: 'Username or email already exists' });
    
    const hashed = await bcrypt.hash(password, 10);
    const admin = new Admin({ username, password: hashed, email, fullName, role: 'admin', createdBy: validCode.generatedBy });
    await admin.save();
    
    await AdminCode.deleteOne({ code });
    res.json({ message: 'Admin created successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all admins (superadmin only)
app.get('/api/admin/all', async (req, res) => {
  const admins = await Admin.find({}, '-password');
  res.json(admins);
});

// Delete admin (superadmin only)
app.delete('/api/admin/:id', async (req, res) => {
  const { adminId, targetId } = req.body;
  const currentAdmin = await Admin.findById(adminId);
  if (!currentAdmin || currentAdmin.role !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can delete admins' });
  }
  
  const targetAdmin = await Admin.findById(targetId);
  if (!targetAdmin) return res.status(404).json({ message: 'Admin not found' });
  if (targetAdmin.role === 'superadmin') return res.status(403).json({ message: 'Cannot delete superadmin' });
  
  await Admin.findByIdAndDelete(targetId);
  res.json({ message: 'Admin deleted successfully' });
});

// ========== PRODUCT ROUTES ==========

app.get('/api/products', async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

app.post('/api/products', async (req, res) => {
  const product = new Product(req.body);
  await product.save();
  res.status(201).json(product);
});

app.put('/api/products/:id', async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(product);
});

app.delete('/api/products/:id', async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: 'Product deleted' });
});

// ========== ORDER ROUTES ==========

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
  const orders = await Order.find().sort({ orderDate: -1 });
  res.json(orders);
});

// ========== START SERVER ==========
const PORT = 5000;
app.listen(PORT, async () => {
  await initProducts();
  const adminCount = await Admin.countDocuments();
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`👥 Admins: ${adminCount}`);
  if (adminCount === 0) console.log(`\n🔐 First time setup: http://localhost:3000/admin/setup`);
  console.log(`📝 Admin signup: http://localhost:3000/admin/signup`);
});