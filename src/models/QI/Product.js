const mongoose = require('mongoose');
const qiConnection = require('../../config/qiDatabase');

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
    // identity / source
    sourceId: { type: Number, unique: true, sparse: true, index: true },
    wpType: { type: String, default: 'simple' },

    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },

    sku: { type: String, index: true, sparse: true },
    brand: { type: String },

    // publishing / flags
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft',
        index: true
    },
    featured: { type: Boolean, default: false, index: true },
    fiscalizado: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date },

    // taxonomy
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

    // content
    description_html: String,
    description_text: String,
    short_html: String,
    short_text: String,

    seo: {
        title: String,
        description: String,
        keywords: [String]
    },

    // media
    media: {
        hero: { type: ImageSchema, default: null },
        gallery: { type: [ImageSchema], default: [] }
    },

    images: {
        type: [ImageSchema],
        default: []
    },

    // presentations - references to CanonicalPresentation collection
    presentationIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CanonicalPresentation',
        index: true
    }],

    // DEPRECATED: Old embedded presentation data (keep for backward compatibility)
    presentations: { type: [PresentationSnippetSchema], default: [] },
    defaultPresentation: { type: PresentationSnippetSchema, default: null },

    // metrics
    views: { type: Number, default: 0, index: true },
    searches: { type: Number, default: 0, index: true },
    totalQuotes: { type: Number, default: 0, index: true },

    // stock / availability
    stock_status: { type: String },

    // AI-generated stuff (can expand later)
    ai: {
        description: String,
        shortDescription: String,
        seoTitle: String,
        seoDescription: String
    },

    // everything else / legacy
    sourceUrl: String,
    related_source_ids: [Number],
    sourceMeta: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// indexes
ProductSchema.index({ status: 1, featured: 1 });
ProductSchema.index({ categoryIds: 1 });
ProductSchema.index({ views: -1 });
ProductSchema.index({ searches: -1 });
ProductSchema.index({ totalQuotes: -1 });
ProductSchema.index({ title: 'text', description_text: 'text' }); // Text search

module.exports = qiConnection.model('Product', ProductSchema, 'products');
