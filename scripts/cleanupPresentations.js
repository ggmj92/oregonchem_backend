const mongoose = require('mongoose');
require('dotenv').config();

// Direct connection to production MongoDB
const MONGODB_URI = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI_QI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI_PROD environment variable is not set');
    console.log('Please set it with:');
    console.log('export MONGODB_URI_PROD="your-mongodb-uri"');
    process.exit(1);
}

// Create connection - let MongoDB use the database from the connection string
const connection = mongoose.createConnection(MONGODB_URI);

// Define schemas directly
const ImageSchema = new mongoose.Schema({
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    width: Number,
    height: Number,
    hash: String
}, { _id: false });

const PresentationSchema = new mongoose.Schema({
    qty: { type: Number, required: true },
    unit: { type: String, required: true },
    pretty: { type: String, required: true },
    image: { type: ImageSchema, default: null },
    sortOrder: { type: Number, default: 0 },
    productCount: { type: Number, default: 0 }
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true },
    physicalState: { type: String, enum: ['solido', 'liquido', 'gaseoso'] },
    presentationIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CanonicalPresentation' }]
}, { timestamps: true });

const Presentation = connection.model('CanonicalPresentation', PresentationSchema, 'canonicalpresentations');
const Product = connection.model('Product', ProductSchema, 'products');

// Conversion helper
function convertToKg(qty, unit) {
    const conversions = {
        'kg': 1,
        'g': 0.001,
        'ton': 1000,
        'lb': 0.453592,
        'oz': 0.0283495
    };
    return qty * (conversions[unit] || 1);
}

function convertToLiters(qty, unit) {
    const conversions = {
        'L': 1,
        'ml': 0.001,
        'gal': 3.78541
    };
    return qty * (conversions[unit] || 1);
}

async function analyzePresentations() {
    console.log('=== ANALYZING CURRENT PRESENTATIONS ===\n');

    const presentations = await Presentation.find({}).lean();
    
    const solidUnits = ['kg', 'g', 'ton', 'lb', 'oz'];
    const liquidUnits = ['L', 'ml', 'gal'];

    const solids = presentations.filter(p => solidUnits.includes(p.unit));
    const liquids = presentations.filter(p => liquidUnits.includes(p.unit));

    console.log(`Total presentations: ${presentations.length}`);
    console.log(`Solid presentations: ${solids.length}`);
    console.log(`Liquid presentations: ${liquids.length}\n`);

    // Analyze solids under 20kg
    console.log('--- SOLID PRESENTATIONS UNDER 20kg (TO DELETE) ---');
    const solidsToDelete = solids.filter(p => convertToKg(p.qty, p.unit) < 20);
    solidsToDelete.forEach(p => {
        console.log(`  - ${p.pretty} (${p.qty} ${p.unit} = ${convertToKg(p.qty, p.unit).toFixed(2)} kg) - ${p.productCount} products`);
    });
    console.log(`Total to delete: ${solidsToDelete.length}\n`);

    // Analyze solids 20kg and above (TO KEEP)
    console.log('--- SOLID PRESENTATIONS 20kg+ (TO KEEP) ---');
    const solidsToKeep = solids.filter(p => convertToKg(p.qty, p.unit) >= 20);
    solidsToKeep.forEach(p => {
        console.log(`  - ${p.pretty} (${p.qty} ${p.unit} = ${convertToKg(p.qty, p.unit).toFixed(2)} kg) - ${p.productCount} products`);
    });
    console.log(`Total to keep: ${solidsToKeep.length}\n`);

    // Analyze liquids NOT 14L or 20L (TO DELETE)
    console.log('--- LIQUID PRESENTATIONS (NOT 14L or 20L) (TO DELETE) ---');
    const liquidsToDelete = liquids.filter(p => {
        const liters = convertToLiters(p.qty, p.unit);
        return liters !== 14 && liters !== 20;
    });
    liquidsToDelete.forEach(p => {
        console.log(`  - ${p.pretty} (${p.qty} ${p.unit} = ${convertToLiters(p.qty, p.unit).toFixed(2)} L) - ${p.productCount} products`);
    });
    console.log(`Total to delete: ${liquidsToDelete.length}\n`);

    // Analyze liquids 14L or 20L (TO KEEP)
    console.log('--- LIQUID PRESENTATIONS (14L or 20L) (TO KEEP) ---');
    const liquidsToKeep = liquids.filter(p => {
        const liters = convertToLiters(p.qty, p.unit);
        return liters === 14 || liters === 20;
    });
    liquidsToKeep.forEach(p => {
        console.log(`  - ${p.pretty} (${p.qty} ${p.unit} = ${convertToLiters(p.qty, p.unit).toFixed(2)} L) - ${p.productCount} products`);
    });
    console.log(`Total to keep: ${liquidsToKeep.length}\n`);

    return {
        solidsToDelete: solidsToDelete.map(p => p._id),
        liquidsToDelete: liquidsToDelete.map(p => p._id),
        allToDelete: [...solidsToDelete, ...liquidsToDelete].map(p => p._id)
    };
}

async function removePresentationsFromProducts(presentationIds) {
    console.log('\n=== REMOVING PRESENTATIONS FROM PRODUCTS ===\n');

    // Find all products that have these presentations
    const affectedProducts = await Product.find({
        presentationIds: { $in: presentationIds }
    });

    console.log(`Found ${affectedProducts.length} products with presentations to remove`);

    let updatedCount = 0;
    for (const product of affectedProducts) {
        const originalCount = product.presentationIds.length;
        product.presentationIds = product.presentationIds.filter(
            id => !presentationIds.some(delId => delId.equals(id))
        );
        const newCount = product.presentationIds.length;
        
        await product.save();
        updatedCount++;
        
        console.log(`  - ${product.title}: ${originalCount} → ${newCount} presentations`);
    }

    console.log(`\nUpdated ${updatedCount} products`);
    return updatedCount;
}

async function deletePresentations(presentationIds) {
    console.log('\n=== DELETING PRESENTATIONS ===\n');

    const result = await Presentation.deleteMany({
        _id: { $in: presentationIds }
    });

    console.log(`Deleted ${result.deletedCount} presentations`);
    return result.deletedCount;
}

async function createCilindroPresentation() {
    console.log('\n=== CREATING CILINDRO PRESENTATION ===\n');

    // Check if Cilindro already exists
    const existing = await Presentation.findOne({ pretty: 'Cilindro' });
    if (existing) {
        console.log('Cilindro presentation already exists:', existing._id);
        return existing._id;
    }

    // Create new Cilindro presentation
    const cilindro = new Presentation({
        qty: 1,
        unit: 'cilindro',
        pretty: 'Cilindro',
        image: {
            url: '/images/presentations/Cilindro.png',
            alt: 'Cilindro industrial'
        },
        sortOrder: 100,
        productCount: 0
    });

    await cilindro.save();
    console.log('Created Cilindro presentation:', cilindro._id);
    return cilindro._id;
}

async function addCilindroToLiquidProducts(cilindroId) {
    console.log('\n=== ADDING CILINDRO TO LIQUID PRODUCTS ===\n');

    // Find all liquid products
    const liquidProducts = await Product.find({
        physicalState: 'liquido'
    });

    console.log(`Found ${liquidProducts.length} liquid products`);

    let updatedCount = 0;
    for (const product of liquidProducts) {
        // Check if product already has Cilindro
        if (product.presentationIds.some(id => id.equals(cilindroId))) {
            console.log(`  - ${product.title}: Already has Cilindro`);
            continue;
        }

        // Add Cilindro to presentations
        product.presentationIds.push(cilindroId);
        await product.save();
        updatedCount++;
        
        console.log(`  - ${product.title}: Added Cilindro`);
    }

    // Update Cilindro product count
    await Presentation.findByIdAndUpdate(cilindroId, {
        productCount: liquidProducts.length
    });

    console.log(`\nAdded Cilindro to ${updatedCount} liquid products`);
    return updatedCount;
}

async function main() {
    try {
        console.log('Starting presentation cleanup...\n');

        // Wait for MongoDB connection
        console.log('Connecting to MongoDB...');
        await new Promise((resolve, reject) => {
            if (connection.readyState === 1) {
                resolve();
            } else {
                connection.once('connected', resolve);
                connection.once('error', reject);
            }
        });
        console.log('Connected to MongoDB\n');

        // Step 1: Analyze current state
        const { solidsToDelete, liquidsToDelete, allToDelete } = await analyzePresentations();

        console.log('\n=== SUMMARY ===');
        console.log(`Solid presentations to delete: ${solidsToDelete.length}`);
        console.log(`Liquid presentations to delete: ${liquidsToDelete.length}`);
        console.log(`Total presentations to delete: ${allToDelete.length}`);

        // Ask for confirmation
        console.log('\n⚠️  This will:');
        console.log('1. Remove these presentations from all products');
        console.log('2. Delete the presentations from the database');
        console.log('3. Create a new "Cilindro" presentation');
        console.log('4. Add Cilindro to all liquid products');
        console.log('\nProceed? (This script will run automatically in 5 seconds, or press Ctrl+C to cancel)');

        await new Promise(resolve => setTimeout(resolve, 5000));

        // Step 2: Remove presentations from products
        await removePresentationsFromProducts(allToDelete);

        // Step 3: Delete presentations
        await deletePresentations(allToDelete);

        // Step 4: Create Cilindro presentation
        const cilindroId = await createCilindroPresentation();

        // Step 5: Add Cilindro to all liquid products
        await addCilindroToLiquidProducts(cilindroId);

        console.log('\n✅ CLEANUP COMPLETE!\n');
        
        // Final summary
        const remainingPresentations = await Presentation.find({});
        console.log(`Remaining presentations: ${remainingPresentations.length}`);
        remainingPresentations.forEach(p => {
            console.log(`  - ${p.pretty} (${p.qty} ${p.unit}) - ${p.productCount} products`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { analyzePresentations, removePresentationsFromProducts, deletePresentations, createCilindroPresentation, addCilindroToLiquidProducts };
