import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();
const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(cors());
app.use(morgan('dev'));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/craftify';
await mongoose.connect(MONGO_URI);

// ===== Models =====
const ReviewSchema = new mongoose.Schema(
  { 
    user: { type: String, required: true }, 
    rating: { type: Number, min: 1, max: 5, required: true }, 
    comment: { type: String, required: true },
    reply: {
      text: { type: String, default: '' },
      repliedAt: { type: Date }
    }
  },
  { timestamps: true }
);

const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },   // primary string (backward compatible)
    images: { type: [String], default: [] },    // gallery
    category: { type: String, enum: ['jewelry', 'paintings', 'home-decor', 'crafts', 'other'], default: 'other' },
    sellerName: { type: String, required: true },
    featured: { type: Boolean, default: false },
    reviews: { type: [ReviewSchema], default: [] }
  },
  { timestamps: true }
);
const Product = mongoose.model('Product', ProductSchema);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' }
  },
  { timestamps: true }
);
const User = mongoose.model('User', UserSchema);

const OrderSchema = new mongoose.Schema(
  {
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    buyerName: { type: String, required: true },
    buyerEmail: { type: String, required: true },
    items: [{
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      title: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
      image: { type: String, required: true }
    }],
    shipping: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      phone: { type: String, required: true }
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, default: 'simulated' },
    trackingNumber: { type: String },
    notes: { type: String }
  },
  { timestamps: true }
);
const Order = mongoose.model('Order', OrderSchema);

// ===== Helpers & Middleware =====
function buildQuery(q) {
  const filter = {};
  if (q.category) filter.category = q.category;
  if (q.minPrice || q.maxPrice) {
    filter.price = {};
    if (q.minPrice) filter.price.$gte = Number(q.minPrice);
    if (q.maxPrice) filter.price.$lte = Number(q.maxPrice);
  }
  if (q.search) {
    filter.$or = [
      { title: { $regex: q.search, $options: 'i' } },
      { description: { $regex: q.search, $options: 'i' } },
      { sellerName: { $regex: q.search, $options: 'i' } }
    ];
  }
  return filter;
}

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
function roleGuard(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'No user' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

// Robustly coerce image+images into a string[]; first element will be primary
function normalizeImages({ image, images }) {
  const out = [];
  const push = (u) => {
    if (typeof u === 'string') {
      const t = u.trim();
      if (t) out.push(t);
    }
  };
  if (Array.isArray(image)) image.forEach(push); else if (image != null) push(image);
  if (Array.isArray(images)) images.forEach(push); else if (images != null) push(images);
  // dedupe while preserving order
  const seen = new Set();
  const clean = [];
  for (const u of out) {
    if (!seen.has(u)) {
      seen.add(u);
      clean.push(u);
    }
  }
  return clean;
}

// ===== Auth Routes =====
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ message: 'Missing fields' });
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email already registered' });
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hash, role });
  const token = jwt.sign({ id: user._id, role: user.role, name: user.name, email: user.email }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id, role: user.role, name: user.name, email: user.email }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

app.get('/api/auth/me', auth, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
});

// ===== Seed (optional) =====
app.post('/api/seed', async (req, res) => {
  await Product.deleteMany({});
  const seed = [];
  const out = await Product.insertMany(seed);
  res.json(out);
});

// ===== Product APIs =====
app.get('/api/products', async (req, res) => {
  const { page = 1, limit = 24, sort = '-createdAt' } = req.query;
  const filter = buildQuery(req.query);
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(Number(limit)),
    Product.countDocuments(filter)
  ]);
  res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

app.get('/api/products/featured', async (req, res) => {
  const items = await Product.find({ featured: true }).sort('-createdAt').limit(8);
  res.json(items);
});

app.get('/api/products/:id', async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ message: 'Not found' });
  console.log('GET /api/products/:id product images:', p.images);
  res.json(p);
});

// ===== Protected mutations with robust normalization =====
app.post('/api/products', auth, roleGuard('seller', 'admin'), async (req, res, next) => {
  try {
    const { title, description, price, image, images, category, featured } = req.body;
    const imgs = normalizeImages({ image, images });
    console.log('POST /api/products images:', imgs);
    const doc = {
      title,
      description,
      price,
      image: imgs[0] || '',   // ensure string
      images: imgs,           // ensure string[]
      category,
      sellerName: req.user.name,  // Use authenticated user's name
      featured: !!featured
    };
    const p = await Product.create(doc);
    res.status(201).json(p);
  } catch (err) {
    next(err);
  }
});

app.put('/api/products/:id', auth, roleGuard('seller', 'admin'), async (req, res, next) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Product not found' });
    if (req.user.role !== 'admin' && p.sellerName !== req.user.name) {
      return res.status(403).json({ message: 'You can only update your own products' });
    }
    const { image, images } = req.body;
    console.log('PUT /api/products/:id images:', images);
    const update = { ...req.body };
    if (image !== undefined || images !== undefined) {
      const imgs = normalizeImages({ image: image !== undefined ? image : p.image, images: images !== undefined ? images : p.images });
      update.image = imgs[0] || '';
      update.images = imgs;
    }
    const updatedP = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(updatedP);
  } catch (err) {
    next(err);
  }
});

app.delete('/api/products/:id', auth, roleGuard('seller', 'admin'), async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// Reviews & mock checkout
app.post('/api/products/:id/reviews', async (req, res) => {
  const { user, rating, comment } = req.body;
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ message: 'Not found' });
  p.reviews.push({ user, rating, comment });
  await p.save();
  res.status(201).json(p);
});

// Add or update seller reply to a review
app.put('/api/products/:productId/reviews/:reviewIndex/reply', auth, roleGuard('seller', 'admin'), async (req, res) => {
  try {
    const { productId, reviewIndex } = req.params;
    const { text } = req.body;
    const p = await Product.findById(productId);
    if (!p) return res.status(404).json({ message: 'Product not found' });

    const index = parseInt(reviewIndex, 10);
    if (isNaN(index) || index < 0 || index >= p.reviews.length) {
      return res.status(404).json({ message: 'Review not found' });
    }

    p.reviews[index].reply = {
      text: (text || '').trim(),
      repliedAt: text ? new Date() : undefined
    };

    await p.save();
    res.json(p);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/checkout', async (req, res) => {
  const { items, shipping } = req.body;
  res.json({ status: 'success', orderId: 'MOCK-' + Date.now(), items, shipping });
});

// ===== Order APIs =====
// Create new order
app.post('/api/orders', auth, async (req, res) => {
  try {
    const { items, shipping, paymentMethod = 'simulated', notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    if (!shipping || !shipping.name || !shipping.address || !shipping.phone) {
      return res.status(400).json({ message: 'Shipping information incomplete' });
    }

    // Validate items and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ message: `Product ${item.productId} not found` });
      }

      const quantity = item.quantity || 1;
      const price = product.price;
      totalAmount += price * quantity;

      orderItems.push({
        productId: product._id,
        title: product.title,
        price: product.price,
        quantity: quantity,
        image: product.image
      });
    }

    const order = await Order.create({
      buyerId: req.user.id,
      buyerName: req.user.name,
      buyerEmail: req.user.email,
      items: orderItems,
      shipping,
      totalAmount,
      paymentMethod,
      notes
    });

    res.status(201).json(order);
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// Get buyer's orders
app.get('/api/orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ buyerId: req.user.id })
      .sort('-createdAt')
      .populate('items.productId', 'title image');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Get seller's orders (orders containing their products)
app.get('/api/orders/seller', auth, roleGuard('seller', 'admin'), async (req, res) => {
  try {
    // Find all products by this seller
    const sellerProducts = await Product.find({ sellerName: req.user.name });
    const productIds = sellerProducts.map(p => p._id);

    // Find orders containing these products
    const orders = await Order.find({
      'items.productId': { $in: productIds }
    })
      .sort('-createdAt')
      .populate('buyerId', 'name email');

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch seller orders' });
  }
});

// Update order status (seller only)
app.put('/api/orders/:id/status', auth, roleGuard('seller', 'admin'), async (req, res) => {
  try {
    const { status, trackingNumber, notes } = req.body;

    if (!['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if seller has products in this order
    const sellerProducts = await Product.find({ sellerName: req.user.name });
    const sellerProductIds = sellerProducts.map(p => p._id.toString());
    const hasSellerProducts = order.items.some(item =>
      sellerProductIds.includes(item.productId.toString())
    );

    if (!hasSellerProducts) {
      return res.status(403).json({ message: 'You can only update orders containing your products' });
    }

    const updateData = { status };
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (notes) updateData.notes = notes;

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

// ===== Global error handler (JSON, proper codes) =====
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || (err.name === 'ValidationError' ? 400 : 500);
  res.status(status).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running http://localhost:${PORT}`));
