# QI System Overview

Complete backend API system for Quimica Industrial product catalog.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    QI MongoDB Database                       │
│                   (localhost:27017/qi)                       │
│                                                              │
│  Collections:                                                │
│  • products (368 documents)                                  │
│  • categories (9 canonical categories)                       │
│  • canonicalpresentations (24 standard sizes)                │
│  • banners (promotional banners)                             │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                  Backend API Server                          │
│              (Node.js + Express + Mongoose)                  │
│                                                              │
│  Routes: /api/qi/*                                           │
│  • Products (10 endpoints)                                   │
│  • Categories (7 endpoints)                                  │
│  • Presentations (8 endpoints)                               │
│  • Banners (8 endpoints)                                     │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Astro)                          │
│            quimicaindustrial-frontend                        │
│                                                              │
│  Pages:                                                      │
│  • Homepage (with banners)                                   │
│  • Products catalog                                          │
│  • Product detail                                            │
│  • Category pages                                            │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│              Dashboard (React + Vite)                        │
│              oregonchem_dashboard                            │
│                                                              │
│  Admin Interface:                                            │
│  • Product management (CRUD)                                 │
│  • Category management (CRUD)                                │
│  • Presentation management (CRUD + image upload)             │
│  • Banner management (CRUD + scheduling)                     │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### Products (368 documents)

- **Core fields**: title, slug, status, featured
- **Taxonomy**: categoryIds (refs), presentationIds (refs), tags
- **Content**: description_html, description_text, short_html, short_text
- **Media**: images array, media.hero, media.gallery
- **SEO**: seo.title, seo.description, seo.keywords
- **AI**: ai.description, ai.shortDescription, ai.seoTitle, ai.seoDescription
- **Metrics**: views, searches, totalQuotes
- **Legacy**: sourceId (from WooCommerce), wpType, sourceMeta

### Categories (9 canonical)

1. Agro-Industria
2. Alimentación
3. Cosmética
4. Farmacia
5. Fragancias
6. Industrial
7. Lubricantes
8. Materias Primas
9. Minería

**Fields**: name, slug, description, image, parentId, legacy flag

### Canonical Presentations (24 standard)

**Weights**: 35g, 250g, 500g, 700g, 800g, 1kg, 3kg, 4kg, 5kg, 7kg, 10kg, 14kg, 15kg, 18kg, 20kg, 25kg, 190kg  
**Volumes**: 100ml, 1L, 4L, 10L, 20L, 1 galón, 5 galones

**Fields**: qty, unit, pretty, image, sortOrder, productCount

### Banners

**Placements**: homepage-hero, homepage-top, homepage-middle, homepage-bottom, products-top, category-top, global

**Fields**: title, image, link, placement, active, startDate, endDate, sortOrder, overlay, impressions, clicks

## API Endpoints (33 total)

### Products (10)

- `GET /api/qi/products` - List with filters/search/pagination
- `GET /api/qi/products/:id` - Get by ID
- `GET /api/qi/products/slug/:slug` - Get by slug
- `GET /api/qi/products/featured` - Featured products
- `GET /api/qi/products/:id/related` - Related products
- `POST /api/qi/products` - Create
- `PUT /api/qi/products/:id` - Update
- `DELETE /api/qi/products/:id` - Delete
- `PATCH /api/qi/products/:id/publish` - Toggle publish
- Search supports full-text on title and description

### Categories (7)

- `GET /api/qi/categories` - List all
- `GET /api/qi/categories/:id` - Get by ID
- `GET /api/qi/categories/slug/:slug` - Get by slug
- `GET /api/qi/categories/:id/products` - Products in category
- `POST /api/qi/categories` - Create
- `PUT /api/qi/categories/:id` - Update
- `DELETE /api/qi/categories/:id` - Delete (protected)

### Presentations (8)

- `GET /api/qi/presentations` - List all 24
- `GET /api/qi/presentations/:id` - Get by ID
- `GET /api/qi/presentations/:id/products` - Products with presentation
- `POST /api/qi/presentations` - Create
- `PUT /api/qi/presentations/:id` - Update
- `DELETE /api/qi/presentations/:id` - Delete (protected)
- `PATCH /api/qi/presentations/:id/image` - Update image
- `POST /api/qi/presentations/sync-counts` - Sync product counts

### Banners (8)

- `GET /api/qi/banners` - List all
- `GET /api/qi/banners/active/:placement` - Active for placement
- `GET /api/qi/banners/:id` - Get by ID
- `POST /api/qi/banners` - Create
- `PUT /api/qi/banners/:id` - Update
- `DELETE /api/qi/banners/:id` - Delete
- `PATCH /api/qi/banners/:id/toggle` - Toggle active
- `POST /api/qi/banners/:id/impression` - Track impression
- `POST /api/qi/banners/:id/click` - Track click

## File Structure

```
oregonchem_backend/
├── src/
│   ├── config/
│   │   └── qiDatabase.js          # QI MongoDB connection
│   ├── models/QI/
│   │   ├── Product.js             # Product schema
│   │   ├── Category.js            # Category schema
│   │   ├── CanonicalPresentation.js # Presentation schema
│   │   └── Banner.js              # Banner schema
│   ├── controllers/QI/
│   │   ├── ProductController.js   # Product logic
│   │   ├── CategoryController.js  # Category logic
│   │   ├── PresentationController.js # Presentation logic
│   │   └── BannerController.js    # Banner logic
│   └── routes/
│       └── qiRoutes.js            # All QI routes
├── app.js                         # Main server file
├── test-qi-api.js                 # API test suite
├── QI_API_DOCUMENTATION.md        # Full API docs
└── QI_SYSTEM_OVERVIEW.md          # This file
```

## Data Migration Status

✅ **Completed:**

- Extracted 373 products from QI WooCommerce
- Extracted 355 products from Insumos WooCommerce
- Consolidated to 9 canonical categories
- AI-classified all products into categories
- Matched 188 products with presentations (50.4%)
- Created 24 canonical presentation sizes
- Migrated 185 products to use canonical presentations
- Fixed gallon/gram unit issues
- Restored missing 800g presentation

## Current Stats

- **Products**: 368 total
  - 185 with presentations (50.3%)
  - 0 featured (needs configuration)
  - 0 published (all in draft status)
- **Categories**: 9 canonical
- **Presentations**: 24 standard sizes
  - Most used: 1kg (148 products), 5kg (115 products)
  - Least used: 35g, 100ml, 15kg, 190kg (1 product each)
- **Banners**: 0 (ready to create)

## Next Steps

### Immediate (Backend)

1. ✅ Database review and fixes
2. ✅ Canonical presentation system
3. ✅ Backend API endpoints
4. ✅ Banner system

### Frontend Integration

5. Update Astro frontend to use MongoDB API
6. Replace WooCommerce data fetching
7. Implement banner display system
8. Add presentation image display

### Content & Media

9. Upload presentation images (24 images needed)
10. Generate/source category images (9 images needed)
11. AI-generate product descriptions
12. Implement SEO metadata

### Dashboard

13. Build product CRUD interface
14. Build category management
15. Build presentation management with image upload
16. Build banner management with scheduling

### Production

17. Publish products (change status to 'published')
18. Set featured products
19. Deploy backend to production
20. Deploy frontend to production

## Environment Variables

```bash
# Backend (.env)
MONGODB_URI_QI=mongodb://localhost:27017/qi
MONGODB_URI_PROD=mongodb+srv://...  # Keep for other collections
NODE_ENV=development
PORT=5001
```

## Testing

```bash
# Test all endpoints
node test-qi-api.js

# Test specific endpoint
curl http://localhost:5001/api/qi/products?limit=5

# Test banner endpoint
curl http://localhost:5001/api/qi/banners/active/homepage-hero
```

## Notes

- All models use the QI database connection (separate from production DB)
- Presentations are global/canonical (not product-specific)
- Products reference presentations via ObjectId
- Categories exclude legacy WooCommerce categories
- Banners support date-based scheduling
- All endpoints return consistent JSON format
- Image uploads will be handled separately (not yet implemented)
- Authentication/authorization not yet implemented (add later)
