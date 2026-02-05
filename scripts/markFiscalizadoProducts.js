require('dotenv').config();
const mongoose = require('mongoose');

// Connect to the qi database where products are actually stored
const baseUri = process.env.MONGODB_URI_PROD;
if (!baseUri) {
    throw new Error('MONGODB_URI_PROD environment variable is required');
}
const mongoUri = baseUri.includes('?') ? baseUri.replace('?', 'qi?') : baseUri + '/qi';

const options = {
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
};

const connection = mongoose.createConnection(mongoUri, options);

// Define Product schema directly
const ImageSchema = new mongoose.Schema({
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    width: Number,
    height: Number,
    hash: String
}, { _id: false });

const PresentationSnippetSchema = new mongoose.Schema({
    qty: Number,
    unit: String,
    pretty: String
}, { _id: false });

const ProductSchema = new mongoose.Schema({
    sourceId: { type: Number, unique: true, sparse: true, index: true },
    wpType: { type: String, default: 'simple' },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    sku: { type: String, index: true, sparse: true },
    brand: { type: String },
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft',
        index: true
    },
    featured: { type: Boolean, default: false, index: true },
    fiscalizado: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date },
    categoryIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        index: true
    }],
    tags: { type: [String], index: true },
    relatedProductIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        index: true
    }],
    relatedProducts: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        reason: String
    }],
    description_html: String,
    description_text: String,
    short_html: String,
    short_text: String,
    seo: {
        title: String,
        description: String,
        keywords: [String]
    },
    media: {
        hero: { type: ImageSchema, default: null },
        gallery: { type: [ImageSchema], default: [] }
    },
    images: {
        type: [ImageSchema],
        default: []
    },
    presentationIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CanonicalPresentation',
        index: true
    }],
    presentations: { type: [PresentationSnippetSchema], default: [] },
    defaultPresentation: { type: PresentationSnippetSchema, default: null },
    views: { type: Number, default: 0, index: true },
    searches: { type: Number, default: 0, index: true },
    totalQuotes: { type: Number, default: 0, index: true },
    stock_status: { type: String },
    physicalState: {
        type: String,
        enum: ['solido', 'liquido', 'gel', 'polvo', 'granulado', 'pasta', 'gas', 'unknown'],
        default: 'unknown'
    },
    ai: {
        description: String,
        shortDescription: String,
        seoTitle: String,
        seoDescription: String
    },
    sourceUrl: String,
    related_source_ids: [Number],
    sourceMeta: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const Product = connection.model('Product', ProductSchema, 'products');

// List of fiscalizado products from Decreto Supremo N° 268-2019-EF
// ANEXO 1 and ANEXO 2
const FISCALIZADO_PRODUCTS = [
    // ANEXO 1 - Insumos químicos y productos fiscalizados
    'acetato de etilo',
    'acetato de n-propilo',
    'acetato de propilo',
    'acetona',
    'ácido antranílico',
    'acido antranilic',
    'ácido clorhídrico',
    'acido clorhidrico',
    'cloruro de hidrógeno',
    'ácido fórmico',
    'acido formico',
    'ácido metanoico',
    'ácido nítrico',
    'acido nitrico',
    'nitrato de hidrógeno',
    'ácido sulfúrico',
    'acido sulfurico',
    'amoníaco',
    'amoniaco',
    'hidróxido de amonio',
    'anhídrido acético',
    'anhidrido acetico',
    'óxido acético',
    'benceno',
    'benzol',
    'carbonato de sodio',
    'carbonato sódico',
    'sosa',
    'carbonato de potasio',
    'sal tártara',
    'cloruro de amonio',
    'sal amónica',
    'éter etílico',
    'eter etilico',
    'óxido de etilo',
    'éter dietílico',
    'hexano',
    'n-hexano',
    'hidróxido de calcio',
    'hidroxido de calcio',
    'cal hidratada',
    'cal apagada',
    'hipoclorito de sodio',
    'hipoclorito sódico',
    'lejía',
    'isosafrol',
    'kerosene',
    'keroseno',
    'metil etil cetona',
    'mek',
    'butanona',
    '2-butanona',
    'metil isobutil cetona',
    'mibk',
    'hexona',
    '4-metil-2-pentanona',
    'óxido de calcio',
    'oxido de calcio',
    'cal viva',
    'cal fundente',
    'permanganato de potasio',
    'camaleón mineral',
    'piperonal',
    'heliotropina',
    'safrol',
    'sulfato de sodio',
    'sulfato sódico',
    'sal de glauber',
    'tolueno',
    'toluol',
    'metil benceno',
    'xileno',
    'xilol',
    'dimetilbenceno',
    'ácido sulfámico',
    'acido sulfamico',
    'ácido amidosulfúrico',
    'cloruro de calcio',
    'dicloruro de calcio',
    'hidróxido de sodio',
    'hidroxido de sodio',
    'soda cáustica',
    'sosa cáustica',
    'metabisulfito de sodio',
    'pirosulfito sódico',
    'disulfito de sodio',
    
    // ANEXO 2 - Hidrocarburos y derivados del petróleo
    'diesel',
    'diesel bx',
    'diesel bx s50',
    'biodiesel',
    'gasolina',
    'gasohol',
    'hidrocarburo alifático liviano',
    'hal',
    'hidrocarburo acídico saturado',
    'has',
    'kerosene de aviación',
    'turbo a1',
    'turbo jet a1',
    'turbo jp5',
    'solvente nº 1',
    'solvente n° 1',
    'solvente 1',
    'bencina',
    'solvente nº 3',
    'solvente n° 3',
    'solvente 3',
    'varsol',
    'petróleo lampante',
    'aceite mineral'
];

// Normalize text for comparison
function normalizeText(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s]/g, '') // Remove special chars
        .trim();
}

// Check if product name matches any fiscalizado product
function isFiscalizado(productName) {
    const normalizedName = normalizeText(productName);
    
    return FISCALIZADO_PRODUCTS.some(fiscalizado => {
        const normalizedFiscalizado = normalizeText(fiscalizado);
        
        // Exact match
        if (normalizedName === normalizedFiscalizado) {
            return true;
        }
        
        // Contains match (for products with additional descriptors)
        if (normalizedName.includes(normalizedFiscalizado) || 
            normalizedFiscalizado.includes(normalizedName)) {
            return true;
        }
        
        return false;
    });
}

async function markFiscalizadoProducts() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        console.log('Using URI:', mongoUri);
        await connection.asPromise();
        console.log('✅ Connected to MongoDB');
        console.log('Database name:', connection.db.databaseName);
        
        // List all databases
        const adminDb = connection.db.admin();
        const { databases } = await adminDb.listDatabases();
        console.log('\nAvailable databases:');
        databases.forEach(db => {
            console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
        });
        
        console.log('\nCollection name: products\n');

        console.log('📋 Fetching all products...');
        const products = await Product.find({});
        console.log(`Found ${products.length} products\n`);
        
        if (products.length === 0) {
            console.log('⚠️  No products found. Checking collection directly...');
            const directCount = await connection.db.collection('products').countDocuments();
            console.log(`Direct collection count: ${directCount}`);
            
            if (directCount > 0) {
                const sample = await connection.db.collection('products').findOne({});
                console.log('Sample product title:', sample?.title);
            }
        }

        let markedCount = 0;
        let alreadyMarkedCount = 0;
        const markedProducts = [];

        console.log('🔍 Analyzing products...\n');

        for (const product of products) {
            const shouldBeFiscalizado = isFiscalizado(product.title);
            
            if (shouldBeFiscalizado) {
                if (product.fiscalizado) {
                    alreadyMarkedCount++;
                    console.log(`⏭️  Already marked: ${product.title}`);
                } else {
                    product.fiscalizado = true;
                    await product.save();
                    markedCount++;
                    markedProducts.push(product.title);
                    console.log(`✅ Marked as fiscalizado: ${product.title}`);
                }
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total products analyzed: ${products.length}`);
        console.log(`Newly marked as fiscalizado: ${markedCount}`);
        console.log(`Already marked as fiscalizado: ${alreadyMarkedCount}`);
        console.log(`Total fiscalizado products: ${markedCount + alreadyMarkedCount}`);
        
        if (markedProducts.length > 0) {
            console.log('\n📝 Newly marked products:');
            markedProducts.forEach((name, index) => {
                console.log(`   ${index + 1}. ${name}`);
            });
        }
        
        console.log('\n✨ Script completed successfully!');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the script
markFiscalizadoProducts();
