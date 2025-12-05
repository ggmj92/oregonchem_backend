const CanonicalPresentation = require('../../models/QI/CanonicalPresentation');
const Product = require('../../models/QI/Product');

// GET /api/qi/presentations - Get all canonical presentations
exports.getPresentations = async (req, res) => {
    try {
        const presentations = await CanonicalPresentation.find({})
            .sort({ sortOrder: 1 })
            .lean();

        res.json({
            success: true,
            data: presentations
        });
    } catch (error) {
        console.error('Error fetching presentations:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// GET /api/qi/presentations/:id - Get single presentation
exports.getPresentationById = async (req, res) => {
    try {
        const presentation = await CanonicalPresentation.findById(req.params.id).lean();

        if (!presentation) {
            return res.status(404).json({
                success: false,
                error: 'Presentation not found'
            });
        }

        res.json({
            success: true,
            data: presentation
        });
    } catch (error) {
        console.error('Error fetching presentation:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// GET /api/qi/presentations/:id/products - Get products with this presentation
exports.getPresentationProducts = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const presentation = await CanonicalPresentation.findById(req.params.id);
        if (!presentation) {
            return res.status(404).json({
                success: false,
                error: 'Presentation not found'
            });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const products = await Product.find({
            presentationIds: presentation._id,
            status: 'published'
        })
            .populate('categoryIds', 'name slug image')
            .populate('presentationIds', 'qty unit pretty image sortOrder')
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await Product.countDocuments({
            presentationIds: presentation._id,
            status: 'published'
        });

        res.json({
            success: true,
            data: {
                presentation,
                products,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('Error fetching presentation products:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// POST /api/qi/presentations - Create new presentation
exports.createPresentation = async (req, res) => {
    try {
        const presentation = new CanonicalPresentation(req.body);
        await presentation.save();

        res.status(201).json({
            success: true,
            data: presentation
        });
    } catch (error) {
        console.error('Error creating presentation:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// PUT /api/qi/presentations/:id - Update presentation
exports.updatePresentation = async (req, res) => {
    try {
        const presentation = await CanonicalPresentation.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!presentation) {
            return res.status(404).json({
                success: false,
                error: 'Presentation not found'
            });
        }

        res.json({
            success: true,
            data: presentation
        });
    } catch (error) {
        console.error('Error updating presentation:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// DELETE /api/qi/presentations/:id - Delete presentation
exports.deletePresentation = async (req, res) => {
    try {
        // Check if presentation is used by products
        const productCount = await Product.countDocuments({
            presentationIds: req.params.id
        });

        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                error: `Cannot delete presentation used by ${productCount} products. Please remove from products first.`
            });
        }

        const presentation = await CanonicalPresentation.findByIdAndDelete(req.params.id);

        if (!presentation) {
            return res.status(404).json({
                success: false,
                error: 'Presentation not found'
            });
        }

        res.json({
            success: true,
            message: 'Presentation deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting presentation:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// PATCH /api/qi/presentations/:id/image - Update presentation image
exports.updatePresentationImage = async (req, res) => {
    try {
        const { image } = req.body;

        if (!image || !image.url) {
            return res.status(400).json({
                success: false,
                error: 'Image URL is required'
            });
        }

        const presentation = await CanonicalPresentation.findByIdAndUpdate(
            req.params.id,
            { image },
            { new: true }
        );

        if (!presentation) {
            return res.status(404).json({
                success: false,
                error: 'Presentation not found'
            });
        }

        res.json({
            success: true,
            data: presentation
        });
    } catch (error) {
        console.error('Error updating presentation image:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// POST /api/qi/presentations/sync-counts - Sync product counts for all presentations
exports.syncProductCounts = async (req, res) => {
    try {
        const presentations = await CanonicalPresentation.find({});

        const updates = await Promise.all(
            presentations.map(async (presentation) => {
                const count = await Product.countDocuments({
                    presentationIds: presentation._id
                });

                await CanonicalPresentation.findByIdAndUpdate(presentation._id, {
                    productCount: count
                });

                return {
                    id: presentation._id,
                    pretty: presentation.pretty,
                    productCount: count
                };
            })
        );

        res.json({
            success: true,
            message: 'Product counts synced successfully',
            data: updates
        });
    } catch (error) {
        console.error('Error syncing product counts:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
