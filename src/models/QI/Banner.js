const mongoose = require('mongoose');
const qiConnection = require('../../config/qiDatabase');

const ImageSchema = new mongoose.Schema({
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    width: Number,
    height: Number,
    hash: String
}, { _id: false });

const BannerSchema = new mongoose.Schema({
    title: { type: String, required: true },

    // Banner image
    image: { type: ImageSchema, required: true },

    // Optional link when banner is clicked
    link: {
        url: { type: String },
        openInNewTab: { type: Boolean, default: false }
    },

    // Display settings
    placement: {
        type: String,
        enum: ['homepage-hero', 'homepage-top', 'homepage-middle', 'homepage-bottom', 'products-top', 'category-top', 'global'],
        default: 'homepage-hero',
        index: true
    },

    // Scheduling
    active: { type: Boolean, default: true, index: true },
    startDate: { type: Date },
    endDate: { type: Date },

    // Display order (lower numbers show first)
    sortOrder: { type: Number, default: 0, index: true },

    // Optional text overlay
    overlay: {
        title: String,
        subtitle: String,
        buttonText: String,
        textColor: { type: String, default: '#FFFFFF' },
        backgroundColor: { type: String, default: 'rgba(0,0,0,0.3)' }
    },

    // Analytics
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 }
}, { timestamps: true });

// Indexes
BannerSchema.index({ active: 1, placement: 1, sortOrder: 1 });
BannerSchema.index({ startDate: 1, endDate: 1 });

// Method to check if banner should be displayed
BannerSchema.methods.isVisible = function () {
    if (!this.active) return false;

    const now = new Date();

    if (this.startDate && now < this.startDate) return false;
    if (this.endDate && now > this.endDate) return false;

    return true;
};

// Static method to get active banners for a placement
BannerSchema.statics.getActiveForPlacement = async function (placement) {
    const now = new Date();

    return this.find({
        active: true,
        placement: placement,
        $or: [
            { startDate: { $exists: false } },
            { startDate: { $lte: now } }
        ],
        $or: [
            { endDate: { $exists: false } },
            { endDate: { $gte: now } }
        ]
    }).sort({ sortOrder: 1 });
};

module.exports = qiConnection.model('Banner', BannerSchema, 'banners');
