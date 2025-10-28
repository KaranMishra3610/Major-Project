const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Load environment variables if .env file exists (optional)
try {
  require('dotenv').config();
} catch (error) {
  console.log('No .env file found, using default values');
}

// Configuration with fallback to hardcoded values if .env doesn't exist
const port = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'SnapIt2024_SecureKey_9372175185_Swayam_PayApp_JWT_Token_Secret_Key';

// Enable CORS for local development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

const uri = process.env.MONGODB_URI || 'mongodb+srv://swayam88:1234@cluster0.wnwpthu.mongodb.net/product?retryWrites=true&w=majority';
const dbName = 'product';
const productCollectionName = 'product';
const userCollectionName = 'users';
const complaintCollectionName = 'complaints';

let db;

// Connect to MongoDB Atlas
MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    db = client.db(dbName);
    console.log('✅ Connected to MongoDB Atlas');
  })
  .catch(error => console.error('❌ Error connecting to MongoDB Atlas:', error));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ==================== AUTH ENDPOINTS ====================

// Register endpoint
app.post('/register', async (req, res) => {
  const { username, email, password, phone } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  try {
    const usersCollection = db.collection(userCollectionName);
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      username,
      email,
      password: hashedPassword,
      phone: phone || '',
      balance: 100, // Starting balance
      createdAt: new Date()
    };

    const result = await usersCollection.insertOne(newUser);
    
    // Generate token
    const token = jwt.sign(
      { id: result.insertedId, username, email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ User registered:', username);
    res.json({
      success: true,
      message: 'User registered successfully',
      token,
      user: { username, email, balance: 100 }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const usersCollection = db.collection(userCollectionName);
    
    // Find user
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ User logged in:', user.username);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        username: user.username,
        email: user.email,
        balance: user.balance || 100,
        phone: user.phone || ''
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get user profile (protected route)
app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const usersCollection = db.collection(userCollectionName);
    const user = await usersCollection.findOne(
      { email: req.user.email },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        username: user.username,
        email: user.email,
        balance: user.balance || 100,
        phone: user.phone || ''
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ==================== PRODUCT ENDPOINTS ====================

// Check UID and get product details
app.get('/checkUID', authenticateToken, async (req, res) => {
  const uid = req.query.uid;
  console.log('Checking UID:', uid);

  if (!uid) {
    return res.status(400).json({ error: 'UID is required' });
  }

  try {
    const collection = db.collection(productCollectionName);
    const product = await collection.findOne({ UID: uid });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log('Product found:', product.ProductName);
    res.json({ success: true, product });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Purchase a product
app.post('/purchaseProduct', authenticateToken, async (req, res) => {
  const uid = req.body.uid;
  const username = req.user.username;
  console.log('Purchase request for UID:', uid, 'by user:', username);

  if (!uid) {
    return res.status(400).json({ error: 'UID is required' });
  }

  try {
    const productCollection = db.collection(productCollectionName);
    const usersCollection = db.collection(userCollectionName);
    
    // Check product availability
    const product = await productCollection.findOne({ UID: uid });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if product is owned by supermarket
    if (product.ProductOwner !== 'supermarket') {
      return res.status(400).json({ 
        success: false, 
        error: 'Product is already owned by another user' 
      });
    }

    // Check user balance
    const user = await usersCollection.findOne({ username });
    const userBalance = user.balance || 0;
    const productPrice = parseFloat(product.ProductPrice) || 0;

    if (userBalance < productPrice) {
      return res.status(400).json({ 
        success: false, 
        error: 'Insufficient balance' 
      });
    }

    // Update product owner
    await productCollection.updateOne(
      { UID: uid },
      { $set: { ProductOwner: username } }
    );

    // Deduct balance from user
    await usersCollection.updateOne(
      { username },
      { $inc: { balance: -productPrice } }
    );

    const updatedProduct = await productCollection.findOne({ UID: uid });
    const updatedUser = await usersCollection.findOne({ username });

    console.log('✅ Product purchased successfully');
    res.json({ 
      success: true, 
      message: 'Product purchased successfully', 
      product: updatedProduct,
      newBalance: updatedUser.balance
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Return a product
app.post('/returnProduct', authenticateToken, async (req, res) => {
  const uid = req.body.uid;
  const username = req.user.username;
  console.log('Return request for UID:', uid, 'by user:', username);

  if (!uid) {
    return res.status(400).json({ error: 'UID is required' });
  }

  try {
    const productCollection = db.collection(productCollectionName);
    const usersCollection = db.collection(userCollectionName);
    
    const product = await productCollection.findOne({ UID: uid });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Check if the product is owned by the current user
    if (product.ProductOwner !== username) {
      return res.status(400).json({ 
        error: 'You can only return products that you own' 
      });
    }
    
    // Update product owner to supermarket
    await productCollection.updateOne(
      { UID: uid },
      { $set: { ProductOwner: 'supermarket' } }
    );

    // Refund balance to user
    const productPrice = parseFloat(product.ProductPrice) || 0;
    await usersCollection.updateOne(
      { username },
      { $inc: { balance: productPrice } }
    );

    const updatedProduct = await productCollection.findOne({ UID: uid });
    const updatedUser = await usersCollection.findOne({ username });

    console.log('✅ Product returned successfully');
    res.json({ 
      success: true, 
      message: 'Product returned to supermarket',
      product: updatedProduct,
      newBalance: updatedUser.balance
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get user's purchases
app.get('/purchases', authenticateToken, async (req, res) => {
  const username = req.user.username;
  console.log('Fetching purchases for user:', username);
  
  try {
    const collection = db.collection(productCollectionName);
    const products = await collection.find({ ProductOwner: username }).toArray();
    console.log(`Found ${products.length} purchases`);
    res.json(products);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update user balance
app.post('/updateBalance', authenticateToken, async (req, res) => {
  const { amount } = req.body;
  const username = req.user.username;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid amount is required' });
  }

  try {
    const usersCollection = db.collection(userCollectionName);
    
    await usersCollection.updateOne(
      { username },
      { $inc: { balance: amount } }
    );

    const user = await usersCollection.findOne({ username });
    
    console.log('✅ Balance updated for user:', username);
    res.json({
      success: true,
      newBalance: user.balance
    });
  } catch (error) {
    console.error('Error updating balance:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ==================== DASHBOARD ENDPOINTS ====================

// Get inventory statistics
app.get('/dashboard/inventory', authenticateToken, async (req, res) => {
  try {
    const collection = db.collection(productCollectionName);
    
    // Get all products
    const allProducts = await collection.find({}).toArray();
    
    // Calculate statistics
    const totalProducts = allProducts.length;
    const availableProducts = allProducts.filter(p => p.ProductOwner === 'supermarket').length;
    const soldProducts = allProducts.filter(p => p.ProductOwner !== 'supermarket').length;
    
    // Products by category
    const categoryStats = {};
    allProducts.forEach(product => {
      const category = product.catNumber || 'uncategorized';
      if (!categoryStats[category]) {
        categoryStats[category] = 0;
      }
      categoryStats[category]++;
    });
    
    // Revenue calculation
    const totalRevenue = allProducts
      .filter(p => p.ProductOwner !== 'supermarket')
      .reduce((sum, p) => sum + (parseFloat(p.ProductPrice) || 0), 0);
    
    res.json({
      success: true,
      stats: {
        totalProducts,
        availableProducts,
        soldProducts,
        categoryStats,
        totalRevenue
      }
    });
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ==================== COMPLAINT ENDPOINTS ====================

// Submit a complaint
app.post('/complaint', authenticateToken, async (req, res) => {
  const { subject, message } = req.body;
  const username = req.user.username;
  const email = req.user.email;

  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message are required' });
  }

  try {
    const complaintsCollection = db.collection(complaintCollectionName);
    
    const complaint = {
      username,
      email,
      subject,
      message,
      status: 'pending',
      createdAt: new Date()
    };

    await complaintsCollection.insertOne(complaint);
    
    console.log('✅ Complaint submitted by:', username);
    res.json({
      success: true,
      message: 'Complaint submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting complaint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ==================== CHATBOT ENDPOINTS ====================

// Chatbot endpoint
app.post('/chatbot', authenticateToken, async (req, res) => {
  const { message } = req.body;
  const username = req.user.username;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const userMessage = message.toLowerCase().trim();
    let botResponse = '';

    // Simple rule-based chatbot responses
    if (userMessage.includes('hello') || userMessage.includes('hi') || userMessage.includes('hey')) {
      botResponse = `Hello ${username}! 👋 How can I assist you today? I can help you with purchases, returns, balance, or any general queries.`;
    } 
    else if (userMessage.includes('how to buy') || userMessage.includes('purchase') || userMessage.includes('how to purchase')) {
      botResponse = `To buy a product:\n1. Go to Home tab\n2. Click "Scan QR Code"\n3. Scan the product QR code\n4. Check product details\n5. Click "Purchase Product" button\n\nNote: You can only buy products owned by "supermarket"! 🛒`;
    }
    else if (userMessage.includes('return') || userMessage.includes('how to return')) {
      botResponse = `To return a product:\n1. Scan the product QR code\n2. If you own it, you'll see "Return Product" button\n3. Click the button to return\n4. Your balance will be refunded! 💰\n\nYou can only return products that YOU purchased.`;
    }
    else if (userMessage.includes('balance') || userMessage.includes('add money') || userMessage.includes('load balance')) {
      botResponse = `To add balance:\n1. Go to "Load Balance" tab\n2. Enter the amount you want to add\n3. Click "Add Balance" button\n\nYour current balance: ₹${await getUserBalance(username)} 💵`;
    }
    else if (userMessage.includes('my purchase') || userMessage.includes('what did i buy') || userMessage.includes('order history')) {
      const purchases = await db.collection(productCollectionName).find({ ProductOwner: username }).toArray();
      if (purchases.length > 0) {
        botResponse = `You have ${purchases.length} purchase(s):\n\n`;
        purchases.forEach((product, index) => {
          botResponse += `${index + 1}. ${product.ProductName} - ₹${product.ProductPrice}\n`;
        });
        botResponse += `\nCheck "My Purchases" tab for more details! 🛍️`;
      } else {
        botResponse = `You haven't purchased anything yet. Start shopping now! 🛒`;
      }
    }
    else if (userMessage.includes('dashboard') || userMessage.includes('statistics') || userMessage.includes('stats')) {
      botResponse = `The Dashboard shows:\n📊 Total products in store\n🏪 Available products\n🛍️ Sold products\n💰 Total revenue\n📈 Visual charts\n\nClick the "Dashboard" tab to view detailed statistics!`;
    }
    else if (userMessage.includes('qr') || userMessage.includes('scan') || userMessage.includes('camera')) {
      botResponse = `QR Code Scanner:\n1. Click "Scan QR Code" on Home tab\n2. Allow camera permissions\n3. Point camera at the QR code\n4. Product details will appear automatically!\n\n📸 Make sure the QR code is clear and well-lit.`;
    }
    else if (userMessage.includes('complaint') || userMessage.includes('problem') || userMessage.includes('issue') || userMessage.includes('support')) {
      botResponse = `Need help? We're here for you!\n\n1. Go to "Support" tab\n2. Fill in the complaint form\n3. Submit your issue\n\nOR call us directly: 📞 +91 9372175185\n(Click the green phone button at bottom-right)`;
    }
    else if (userMessage.includes('logout') || userMessage.includes('sign out')) {
      botResponse = `To logout, click the "Logout" button in the top-right corner of the page. You'll be redirected to the login page. See you soon! 👋`;
    }
    else if (userMessage.includes('password') || userMessage.includes('forgot password')) {
      botResponse = `Currently, password reset is not available. Please contact support at 📞 +91 9372175185 for assistance with your account.`;
    }
    else if (userMessage.includes('thank') || userMessage.includes('thanks')) {
      botResponse = `You're welcome, ${username}! 😊 Is there anything else I can help you with?`;
    }
    else if (userMessage.includes('bye') || userMessage.includes('goodbye')) {
      botResponse = `Goodbye, ${username}! Have a great day! Feel free to come back if you need any help. 👋`;
    }
    else if (userMessage.includes('help') || userMessage.includes('what can you do')) {
      botResponse = `I can help you with:\n\n🛒 How to buy products\n↩️ How to return products\n💰 Adding balance\n📦 Viewing your purchases\n📊 Understanding the dashboard\n📸 Using QR scanner\n💬 Filing complaints\n📞 Contacting support\n\nJust ask me anything!`;
    }
    else {
      botResponse = `I'm not sure about that, but I'm here to help! Try asking me about:\n\n• Buying products\n• Returning items\n• Adding balance\n• Your purchases\n• QR scanning\n• Dashboard\n• Support\n\nOr type "help" to see what I can do! 🤖`;
    }

    console.log(`🤖 Chatbot response for ${username}`);
    res.json({
      success: true,
      response: botResponse
    });
  } catch (error) {
    console.error('Error in chatbot:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Helper function to get user balance
async function getUserBalance(username) {
  try {
    const usersCollection = db.collection(userCollectionName);
    const user = await usersCollection.findOne({ username });
    return user ? (user.balance || 0).toFixed(2) : '0.00';
  } catch (error) {
    return '0.00';
  }
}

// ==================== MISC ENDPOINTS ====================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'PayApp API Server',
    endpoints: [
      'POST /register',
      'POST /login',
      'GET /profile',
      'GET /checkUID?uid=xxx',
      'POST /purchaseProduct',
      'POST /returnProduct',
      'GET /purchases',
      'POST /updateBalance',
      'GET /dashboard/inventory',
      'POST /complaint',
      'GET /health'
    ]
  });
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`📡 API endpoints available`);
});

module.exports = app;