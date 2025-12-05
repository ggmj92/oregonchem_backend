const mongoose = require('mongoose');
const qiConnection = require('../../config/qiDatabase');

const QuoteSchema = new mongoose.Schema({
    // Customer information
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    company: String,

    // Quote details
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        productName: String,
        presentation: String,
        quantity: Number,
        notes: String
    }],

    message: String,

    // Status
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'cancelled'],
        default: 'pending'
    },

    // Metadata
    source: {
        type: String,
        default: 'website'
    },
    ipAddress: String,
    userAgent: String
}, {
    timestamps: true
});

// Indexes
QuoteSchema.index({ status: 1, createdAt: -1 });
QuoteSchema.index({ email: 1 });

module.exports = qiConnection.model('Quote', QuoteSchema, 'quotes');
