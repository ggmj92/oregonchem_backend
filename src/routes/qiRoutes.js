const express = require('express');
const router = express.Router();

// Import controllers
const ProductController = require('../controllers/QI/ProductController');
const CategoryController = require('../controllers/QI/CategoryController');
const PresentationController = require('../controllers/QI/PresentationController');
const BannerController = require('../controllers/QI/BannerController');

// ============================================
// PRODUCT ROUTES
// ============================================

// Public routes
router.get('/products', ProductController.getProducts);
router.get('/products/featured', ProductController.getFeaturedProducts);
router.get('/products/slug/:slug', ProductController.getProductBySlug);
router.get('/products/:id', ProductController.getProductById);
router.get('/products/:id/related', ProductController.getRelatedProducts);

// Admin routes (add auth middleware later)
router.post('/products', ProductController.createProduct);
router.put('/products/:id', ProductController.updateProduct);
router.delete('/products/:id', ProductController.deleteProduct);
router.patch('/products/:id/publish', ProductController.togglePublish);

// ============================================
// CATEGORY ROUTES
// ============================================

// Public routes
router.get('/categories', CategoryController.getCategories);
router.get('/categories/slug/:slug', CategoryController.getCategoryBySlug);
router.get('/categories/:id', CategoryController.getCategoryById);
router.get('/categories/:id/products', CategoryController.getCategoryProducts);

// Admin routes (add auth middleware later)
router.post('/categories', CategoryController.createCategory);
router.put('/categories/:id', CategoryController.updateCategory);
router.delete('/categories/:id', CategoryController.deleteCategory);

// ============================================
// PRESENTATION ROUTES
// ============================================

// Public routes
router.get('/presentations', PresentationController.getPresentations);
router.get('/presentations/:id', PresentationController.getPresentationById);
router.get('/presentations/:id/products', PresentationController.getPresentationProducts);

// Admin routes (add auth middleware later)
router.post('/presentations', PresentationController.createPresentation);
router.put('/presentations/:id', PresentationController.updatePresentation);
router.delete('/presentations/:id', PresentationController.deletePresentation);
router.patch('/presentations/:id/image', PresentationController.updatePresentationImage);
router.post('/presentations/sync-counts', PresentationController.syncProductCounts);

// ============================================
// BANNER ROUTES
// ============================================

// Public routes
router.get('/banners', BannerController.getBanners);
router.get('/banners/active/:placement', BannerController.getActiveBanners);
router.get('/banners/:id', BannerController.getBannerById);
router.post('/banners/:id/impression', BannerController.trackImpression);
router.post('/banners/:id/click', BannerController.trackClick);

// Admin routes (add auth middleware later)
router.post('/banners', BannerController.createBanner);
router.put('/banners/:id', BannerController.updateBanner);
router.delete('/banners/:id', BannerController.deleteBanner);
router.patch('/banners/:id/toggle', BannerController.toggleActive);

module.exports = router;
