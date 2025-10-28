const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // For loading environment variables

const app = express();
app.use(cors());
app.use(express.json());
// MongoDB connection
const uri = process.env.MONGODB_URI; // Use environment variable for MongoDB URI
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(error => console.error('Error connecting to MongoDB:', error));

// Define the Product schema and model
const productSchema = new mongoose.Schema({
  ProductName: String,
  ProductOwner: String,
  ProductPrice: Number,
  ImageLink: String,
  UID: String
});
const Product = mongoose.model('Product', productSchema, 'product'); // Collection name is 'product'

// Endpoint to check UID
app.get('/checkUID', async (req, res) => {
  const uid = req.query.uid; // Extract UID from query parameter

  if (!uid) {
    return res.status(400).send('UID parameter is required');
  }
  try {
    const product = await Product.findOne({ UID: uid }); // Query the 'product' collection

    if (product) {
      res.json({ owner: product.ProductOwner || '' }); // Send owner or empty string if not found
    } else {
      res.json({ owner: '' }); // UID not found in the database
    }
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
