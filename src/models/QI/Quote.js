const mongoose = require('mongoose');
const qiConnection = require('../../config/qiDatabase');

const QuoteSchema = new mongoose.Schema({
    // Customer information
    clientType: {
        type: String,
        enum: ['natural', 'empresa', 'natural-empresa'],
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    dni: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    // Company fields (for empresa and natural-empresa)
    companyName: String,
    ruc: String,

    // Quote details
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        productName: String,
        presentationId: String,
        presentationLabel: String,
        quantity: {
            type: Number,
            required: true
        },
        frequency: {
            type: String,
            enum: ['unica', 'quincenal', 'mensual', 'bimestral', 'trimestral'],
            required: true
        }
    }],

    // Contact preferences
    contactPreferences: {
        email: { type: Boolean, default: false },
        whatsapp: { type: Boolean, default: false },
        phone: { type: Boolean, default: false }
    },

    // Additional notes
    observations: String,

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
