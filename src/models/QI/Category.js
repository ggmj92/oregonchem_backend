const mongoose = require('mongoose');
const qiConnection = require('../../config/qiDatabase');

const ImageSchema = new mongoose.Schema({
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    width: Number,
    height: Number,
    hash: String
}, { _id: false });

const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, unique: true, index: true, required: true },

    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },

    image: { type: ImageSchema, default: null },

    description: { type: String },

    // mark whether this is an old Woo category or one of your new canonical ones
    legacy: { type: Boolean, default: false },

    // traceability
    sourceId: { type: Number, unique: true, sparse: true },
    sourceMeta: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Index for hierarchical lookups (children by parent)
CategorySchema.index({ parentId: 1 });

module.exports = qiConnection.model('Category', CategorySchema, 'categories');
