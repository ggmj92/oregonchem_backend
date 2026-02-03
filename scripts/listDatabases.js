const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI_QI;

async function listDatabases() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected!\n');

        const admin = mongoose.connection.db.admin();
        const { databases } = await admin.listDatabases();

        console.log('=== AVAILABLE DATABASES ===');
        databases.forEach(db => {
            console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
        });

        console.log('\n=== CHECKING EACH DATABASE FOR PRODUCTS ===');
        for (const db of databases) {
            if (db.name === 'admin' || db.name === 'local' || db.name === 'config') continue;
            
            const dbConnection = mongoose.connection.useDb(db.name);
            const collections = await dbConnection.db.listCollections().toArray();
            
            console.log(`\n${db.name}:`);
            console.log(`  Collections: ${collections.map(c => c.name).join(', ')}`);
            
            // Check for products
            if (collections.some(c => c.name === 'products')) {
                const Product = dbConnection.model('Product', new mongoose.Schema({}, { strict: false }), 'products');
                const count = await Product.countDocuments();
                console.log(`  Products: ${count}`);
            }
            
            // Check for presentations
            if (collections.some(c => c.name === 'canonicalpresentations')) {
                const Presentation = dbConnection.model('Presentation', new mongoose.Schema({}, { strict: false }), 'canonicalpresentations');
                const count = await Presentation.countDocuments();
                console.log(`  Presentations: ${count}`);
            }
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

listDatabases();
