const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI_PROD;

async function publishAllProducts() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    const db = mongoose.connection.db;
    const collection = db.collection('products');

    // Count before
    const draftCount = await collection.countDocuments({ status: 'draft' });
    console.log(`Draft products found: ${draftCount}`);

    if (draftCount === 0) {
      console.log('No draft products to publish.');
      process.exit(0);
    }

    // Confirm before proceeding
    console.log(`About to publish ${draftCount} products...`);

    const result = await collection.updateMany(
      { status: 'draft' },
      { $set: { status: 'published' } }
    );

    console.log(`Done. ${result.modifiedCount} products published.`);

    // Verify
    const publishedCount = await collection.countDocuments({ status: 'published' });
    console.log(`Total published products now: ${publishedCount}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

publishAllProducts();