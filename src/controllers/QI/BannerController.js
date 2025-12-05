const Banner = require('../../models/QI/Banner');

// GET /api/qi/banners - Get all banners
exports.getBanners = async (req, res) => {
    try {
        const { placement, active } = req.query;

        const query = {};
        if (placement) query.placement = placement;
        if (active !== undefined) query.active = active === 'true';

        const banners = await Banner.find(query)
            .sort({ sortOrder: 1, createdAt: -1 })
            .lean();

        res.json({
            success: true,
            data: banners
        });
    } catch (error) {
        console.error('Error fetching banners:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// GET /api/qi/banners/active/:placement - Get active banners for a placement
exports.getActiveBanners = async (req, res) => {
    try {
        const { placement } = req.params;
        const now = new Date();

        const banners = await Banner.find({
            active: true,
            placement: placement,
            $or: [
                { startDate: { $exists: false } },
                { startDate: null },
                { startDate: { $lte: now } }
            ],
            $and: [
                {
                    $or: [
                        { endDate: { $exists: false } },
                        { endDate: null },
                        { endDate: { $gte: now } }
                    ]
                }
            ]
        })
            .sort({ sortOrder: 1 })
            .lean();

        res.json({
            success: true,
            data: banners
        });
    } catch (error) {
        console.error('Error fetching active banners:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// GET /api/qi/banners/:id - Get single banner
exports.getBannerById = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id).lean();

        if (!banner) {
            return res.status(404).json({
                success: false,
                error: 'Banner not found'
            });
        }

        res.json({
            success: true,
            data: banner
        });
    } catch (error) {
        console.error('Error fetching banner:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// POST /api/qi/banners - Create new banner
exports.createBanner = async (req, res) => {
    try {
        const banner = new Banner(req.body);
        await banner.save();

        res.status(201).json({
            success: true,
            data: banner
        });
    } catch (error) {
        console.error('Error creating banner:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// PUT /api/qi/banners/:id - Update banner
exports.updateBanner = async (req, res) => {
    try {
        const banner = await Banner.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!banner) {
            return res.status(404).json({
                success: false,
                error: 'Banner not found'
            });
        }

        res.json({
            success: true,
            data: banner
        });
    } catch (error) {
        console.error('Error updating banner:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// DELETE /api/qi/banners/:id - Delete banner
exports.deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findByIdAndDelete(req.params.id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                error: 'Banner not found'
            });
        }

        res.json({
            success: true,
            message: 'Banner deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting banner:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// PATCH /api/qi/banners/:id/toggle - Toggle banner active status
exports.toggleActive = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                error: 'Banner not found'
            });
        }

        banner.active = !banner.active;
        await banner.save();

        res.json({
            success: true,
            data: banner
        });
    } catch (error) {
        console.error('Error toggling banner status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// POST /api/qi/banners/:id/impression - Track banner impression
exports.trackImpression = async (req, res) => {
    try {
        const banner = await Banner.findByIdAndUpdate(
            req.params.id,
            { $inc: { impressions: 1 } },
            { new: true }
        );

        if (!banner) {
            return res.status(404).json({
                success: false,
                error: 'Banner not found'
            });
        }

        res.json({
            success: true,
            data: { impressions: banner.impressions }
        });
    } catch (error) {
        console.error('Error tracking impression:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// POST /api/qi/banners/:id/click - Track banner click
exports.trackClick = async (req, res) => {
    try {
        const banner = await Banner.findByIdAndUpdate(
            req.params.id,
            { $inc: { clicks: 1 } },
            { new: true }
        );

        if (!banner) {
            return res.status(404).json({
                success: false,
                error: 'Banner not found'
            });
        }

        res.json({
            success: true,
            data: { clicks: banner.clicks }
        });
    } catch (error) {
        console.error('Error tracking click:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
