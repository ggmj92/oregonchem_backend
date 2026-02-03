const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI_QI;

const connection = mongoose.createConnection(MONGODB_URI, {
    dbName: 'quimicaindustrial'
});

async function checkDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        await new Promise((resolve, reject) => {
            if (connection.readyState === 1) {
                resolve();
            } else {
                connection.once('connected', resolve);
                connection.once('error', reject);
            }
        });
        console.log('Connected!\n');

        // List all collections
        const collections = await connection.db.listCollections().toArray();
        console.log('=== COLLECTIONS IN DATABASE ===');
        collections.forEach(col => {
            console.log(`  - ${col.name}`);
        });

        // Check products collection
        const Product = connection.model('Product', new mongoose.Schema({}, { strict: false }), 'products');
        const productCount = await Product.countDocuments();
        console.log(`\n=== PRODUCTS ===`);
        console.log(`Total products: ${productCount}`);

        if (productCount > 0) {
            const sampleProduct = await Product.findOne().lean();
            console.log('\nSample product structure:');
            console.log(JSON.stringify(sampleProduct, null, 2));
        }

        // Check presentations collection
        const Presentation = connection.model('Presentation', new mongoose.Schema({}, { strict: false }), 'canonicalpresentations');
        const presentationCount = await Presentation.countDocuments();
        console.log(`\n=== PRESENTATIONS ===`);
        console.log(`Total presentations: ${presentationCount}`);

        if (presentationCount > 0) {
            const presentations = await Presentation.find().limit(5).lean();
            console.log('\nFirst 5 presentations:');
            presentations.forEach(p => {
                console.log(`  - ${p.pretty || p.name} (${p.qty} ${p.unit})`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkDatabase();
