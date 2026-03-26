const express = require('express');
const router = express.Router();

// Import controllers
const ProductController = require('../controllers/QI/ProductController');
const CategoryController = require('../controllers/QI/CategoryController');
const PresentationController = require('../controllers/QI/PresentationController');
const BannerController = require('../controllers/QI/BannerController');
const QuoteController = require('../controllers/QI/QuoteController');
const ContactController = require('../controllers/QI/ContactController');

const authMiddleware = require('../middlewares/authMiddleware');

// ============================================
// PRODUCT ROUTES
// ============================================

// Public routes
router.get('/products', ProductController.getProducts);
router.get('/products/slugs', ProductController.getProductSlugs);
router.get('/products/featured', ProductController.getFeaturedProducts);
router.get('/products/slug/:slug', ProductController.getProductBySlug);
router.get('/products/:id', ProductController.getProductById);
router.get('/products/:id/related', ProductController.getRelatedProducts);

// Admin routes (protected)
router.post('/products', authMiddleware, ProductController.createProduct);
router.put('/products/:id', authMiddleware, ProductController.updateProduct);
router.delete('/products/:id', authMiddleware, ProductController.deleteProduct);
router.patch('/products/:id/publish', authMiddleware, ProductController.togglePublish);

// ============================================
// CATEGORY ROUTES
// ============================================

// Public routes
router.get('/categories', CategoryController.getCategories);
router.get('/categories/slug/:slug', CategoryController.getCategoryBySlug);
router.get('/categories/:id', CategoryController.getCategoryById);
router.get('/categories/:id/products', CategoryController.getCategoryProducts);

// Admin routes (protected)
router.post('/categories', authMiddleware, CategoryController.createCategory);
router.put('/categories/:id', authMiddleware, CategoryController.updateCategory);
router.delete('/categories/:id', authMiddleware, CategoryController.deleteCategory);

// ============================================
// PRESENTATION ROUTES
// ============================================

// Public routes
router.get('/presentations', PresentationController.getPresentations);
router.get('/presentations/:id', PresentationController.getPresentationById);
router.get('/presentations/:id/products', PresentationController.getPresentationProducts);

// Admin routes (protected)
router.post('/presentations', authMiddleware, PresentationController.createPresentation);
router.put('/presentations/:id', authMiddleware, PresentationController.updatePresentation);
router.delete('/presentations/:id', authMiddleware, PresentationController.deletePresentation);
router.patch('/presentations/:id/image', authMiddleware, PresentationController.updatePresentationImage);
router.post('/presentations/sync-counts', authMiddleware, PresentationController.syncProductCounts);

// ============================================
// BANNER ROUTES
// ============================================

// Public routes
router.get('/banners', BannerController.getBanners);
router.get('/banners/active/:placement', BannerController.getActiveBanners);
router.get('/banners/:id', BannerController.getBannerById);
router.post('/banners/:id/impression', BannerController.trackImpression);
router.post('/banners/:id/click', BannerController.trackClick);

// Admin routes (protected)
router.post('/banners', authMiddleware, BannerController.createBanner);
router.put('/banners/:id', authMiddleware, BannerController.updateBanner);
router.delete('/banners/:id', authMiddleware, BannerController.deleteBanner);
router.patch('/banners/:id/toggle', authMiddleware, BannerController.toggleActive);

// ============================================
// QUOTE ROUTES
// ============================================

// Public
router.post('/quotes', QuoteController.createQuote);

// Admin (protected)
router.get('/quotes', authMiddleware, QuoteController.getQuotes);
router.get('/quotes/:id', authMiddleware, QuoteController.getQuote);
router.patch('/quotes/:id/status', authMiddleware, QuoteController.updateQuoteStatus);

// ============================================
// CONTACT ROUTES
// ============================================

// Public routes
router.post('/contact', ContactController.sendContactMessage);

module.exports = router;
