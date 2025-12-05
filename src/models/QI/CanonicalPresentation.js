const mongoose = require('mongoose');
const qiConnection = require('../../config/qiDatabase');

const ImageSchema = new mongoose.Schema({
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    width: Number,
    height: Number,
    hash: String
}, { _id: false });

const CanonicalPresentationSchema = new mongoose.Schema({
    qty: { type: Number, required: true },
    unit: { type: String, required: true }, // 'g', 'kg', 'L', 'mL', 'gal', etc.
    pretty: { type: String, required: true }, // "250 g", "1 kg", "1 galón", etc.

    image: { type: ImageSchema, default: null }, // Image for this presentation size

    // For ordering/display
    sortOrder: { type: Number, default: 0 },

    // Usage tracking
    productCount: { type: Number, default: 0 } // How many products use this presentation
}, { timestamps: true });

// Unique index on qty + unit combination
CanonicalPresentationSchema.index({ qty: 1, unit: 1 }, { unique: true });

// Index for sorting
CanonicalPresentationSchema.index({ sortOrder: 1 });

module.exports = qiConnection.model('CanonicalPresentation', CanonicalPresentationSchema, 'canonicalpresentations');
