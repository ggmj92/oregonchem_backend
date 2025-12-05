const Category = require('../../models/QI/Category');
const Product = require('../../models/QI/Product');

// GET /api/qi/categories - Get all categories
exports.getCategories = async (req, res) => {
    try {
        const { includeProductCount = false } = req.query;

        const categories = await Category.find({ legacy: false })
            .sort({ name: 1 })
            .lean();

        // Optionally include product count for each category
        if (includeProductCount === 'true') {
            const categoriesWithCount = await Promise.all(
                categories.map(async (category) => {
                    const productCount = await Product.countDocuments({
                        categoryIds: category._id,
                        status: 'published'
                    });
                    return { ...category, productCount };
                })
            );

            return res.json({
                success: true,
                data: categoriesWithCount
            });
        }

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// GET /api/qi/categories/:id - Get single category
exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id).lean();

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        // Get product count
        const productCount = await Product.countDocuments({
            categoryIds: category._id,
            status: 'published'
        });

        res.json({
            success: true,
            data: { ...category, productCount }
        });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// GET /api/qi/categories/slug/:slug - Get category by slug
exports.getCategoryBySlug = async (req, res) => {
    try {
        const category = await Category.findOne({ slug: req.params.slug }).lean();

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        // Get product count
        const productCount = await Product.countDocuments({
            categoryIds: category._id,
            status: 'published'
        });

        res.json({
            success: true,
            data: { ...category, productCount }
        });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// GET /api/qi/categories/:id/products - Get products in category
exports.getCategoryProducts = async (req, res) => {
    try {
        const { page = 1, limit = 20, sortBy = 'title', sortOrder = 'asc' } = req.query;

        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const products = await Product.find({
            categoryIds: category._id,
            status: 'published'
        })
            .populate('categoryIds', 'name slug image')
            .populate('presentationIds', 'qty unit pretty image sortOrder')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await Product.countDocuments({
            categoryIds: category._id,
            status: 'published'
        });

        res.json({
            success: true,
            data: {
                category,
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
        console.error('Error fetching category products:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// POST /api/qi/categories - Create new category
exports.createCategory = async (req, res) => {
    try {
        const category = new Category(req.body);
        await category.save();

        res.status(201).json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// PUT /api/qi/categories/:id - Update category
exports.updateCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// DELETE /api/qi/categories/:id - Delete category
exports.deleteCategory = async (req, res) => {
    try {
        // Check if category has products
        const productCount = await Product.countDocuments({
            categoryIds: req.params.id
        });

        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                error: `Cannot delete category with ${productCount} products. Please reassign products first.`
            });
        }

        const category = await Category.findByIdAndDelete(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
