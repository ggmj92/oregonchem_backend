const Product = require('../../models/QI/Product');
const Category = require('../../models/QI/Category');
const CanonicalPresentation = require('../../models/QI/CanonicalPresentation');

// GET /api/qi/products - Get all products with filtering, search, and pagination
exports.getProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            category,
            featured,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = {};

        if (status) query.status = status;
        if (featured !== undefined) query.featured = featured === 'true';
        if (category) query.categoryIds = category;
        if (search) {
            query.$text = { $search: search };
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        // Execute query
        const products = await Product.find(query)
            .populate('categoryIds', 'name slug image')
            .populate('presentationIds', 'qty unit pretty image sortOrder')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Get total count for pagination
        const total = await Product.countDocuments(query);

        res.json({
            success: true,
            data: products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// GET /api/qi/products/:id - Get single product by ID
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('categoryIds', 'name slug image description')
            .populate('presentationIds', 'qty unit pretty image sortOrder')
            .populate('relatedProductIds', 'title slug images status')
            .lean();

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// GET /api/qi/products/slug/:slug - Get single product by slug
exports.getProductBySlug = async (req, res) => {
    try {
        const product = await Product.findOne({ slug: req.params.slug })
            .populate('categoryIds', 'name slug image description')
            .populate('presentationIds', 'qty unit pretty image sortOrder')
            .populate('relatedProductIds', 'title slug images status')
            .lean();

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Increment view count
        await Product.findByIdAndUpdate(product._id, { $inc: { views: 1 } });

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// POST /api/qi/products - Create new product
exports.createProduct = async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();

        // Populate references
        await product.populate('categoryIds presentationIds');

        res.status(201).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// PUT /api/qi/products/:id - Update product
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate('categoryIds presentationIds relatedProductIds');

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// DELETE /api/qi/products/:id - Delete product
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// GET /api/qi/products/featured - Get featured products
exports.getFeaturedProducts = async (req, res) => {
    try {
        const { limit = 6 } = req.query;

        const products = await Product.find({ status: 'published', featured: true })
            .populate('categoryIds', 'name slug image')
            .populate('presentationIds', 'qty unit pretty image sortOrder')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Error fetching featured products:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// GET /api/qi/products/related/:id - Get related products
exports.getRelatedProducts = async (req, res) => {
    try {
        const { limit = 4 } = req.query;
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Find products with same categories
        const relatedProducts = await Product.find({
            _id: { $ne: product._id },
            categoryIds: { $in: product.categoryIds },
            status: 'published'
        })
            .populate('categoryIds', 'name slug image')
            .populate('presentationIds', 'qty unit pretty image sortOrder')
            .limit(parseInt(limit))
            .lean();

        res.json({
            success: true,
            data: relatedProducts
        });
    } catch (error) {
        console.error('Error fetching related products:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// PATCH /api/qi/products/:id/publish - Publish/unpublish product
exports.togglePublish = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        product.status = product.status === 'published' ? 'draft' : 'published';
        if (product.status === 'published' && !product.publishedAt) {
            product.publishedAt = new Date();
        }

        await product.save();

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Error toggling publish status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
