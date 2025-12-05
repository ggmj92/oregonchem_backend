# QI MongoDB API Documentation

Base URL: `http://localhost:5001/api/qi` (development)  
Production URL: `https://oregonchem-backend.onrender.com/api/qi`

## Overview

This API provides access to the Quimica Industrial product catalog stored in MongoDB. It includes endpoints for products, categories, and canonical presentations.

**Current Stats:**

- 368 Products
- 9 Categories
- 24 Canonical Presentations
- 185 Products with presentations

---

## Products

### GET /products

Get all products with filtering, search, and pagination.

**Query Parameters:**

- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page
- `status` (string) - Filter by status: `draft` | `published`
- `category` (ObjectId) - Filter by category ID
- `featured` (boolean) - Filter featured products
- `search` (string) - Full-text search in title and description
- `sortBy` (string, default: 'createdAt') - Sort field
- `sortOrder` (string, default: 'desc') - Sort order: `asc` | `desc`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "690bb35a5cb43bd986265c1b",
      "title": "Cafeína Anhidra",
      "slug": "cafeina",
      "status": "draft",
      "featured": false,
      "categoryIds": [...],
      "presentationIds": [...],
      "images": [...],
      "description_text": "...",
      "createdAt": "2024-11-02T17:07:42.000Z",
      "updatedAt": "2024-12-02T22:07:42.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 368,
    "pages": 19
  }
}
```

**Example:**

```bash
GET /api/qi/products?page=1&limit=10&status=published&search=acido
```

---

### GET /products/:id

Get a single product by ID.

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "690bb35a5cb43bd986265c1b",
    "title": "Cafeína Anhidra",
    "categoryIds": [
      {
        "_id": "692f17b96e8c58dd8f6f60d1",
        "name": "Agro-Industria",
        "slug": "agro-industria",
        "image": null
      }
    ],
    "presentationIds": [
      {
        "_id": "6931cb2869446dbf6c881f72",
        "qty": 1,
        "unit": "kg",
        "pretty": "1 kg",
        "sortOrder": 7
      }
    ],
    ...
  }
}
```

---

### GET /products/slug/:slug

Get a single product by slug. Also increments view count.

**Example:**

```bash
GET /api/qi/products/slug/cafeina-anhidra
```

---

### GET /products/featured

Get featured products.

**Query Parameters:**

- `limit` (number, default: 6) - Number of products to return

---

### GET /products/:id/related

Get related products (same categories).

**Query Parameters:**

- `limit` (number, default: 4) - Number of products to return

---

### POST /products

Create a new product.

**Request Body:**

```json
{
  "title": "Nuevo Producto",
  "slug": "nuevo-producto",
  "status": "draft",
  "categoryIds": ["692f17b96e8c58dd8f6f60d1"],
  "presentationIds": ["6931cb2869446dbf6c881f72"],
  "description_text": "Descripción del producto",
  "images": []
}
```

---

### PUT /products/:id

Update a product.

---

### DELETE /products/:id

Delete a product.

---

### PATCH /products/:id/publish

Toggle product publish status (draft ↔ published).

---

## Categories

### GET /categories

Get all categories (excludes legacy categories).

**Query Parameters:**

- `includeProductCount` (boolean) - Include product count for each category

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "692f17b96e8c58dd8f6f60d1",
      "name": "Agro-Industria",
      "slug": "agro-industria",
      "description": "Distribución de insumos agrícolas...",
      "image": null,
      "legacy": false,
      "productCount": 45
    }
  ]
}
```

---

### GET /categories/:id

Get a single category by ID (includes product count).

---

### GET /categories/slug/:slug

Get a category by slug (includes product count).

**Example:**

```bash
GET /api/qi/categories/slug/agro-industria
```

---

### GET /categories/:id/products

Get all products in a category.

**Query Parameters:**

- `page` (number, default: 1)
- `limit` (number, default: 20)
- `sortBy` (string, default: 'title')
- `sortOrder` (string, default: 'asc')

**Response:**

```json
{
  "success": true,
  "data": {
    "category": {...},
    "products": [...],
    "pagination": {...}
  }
}
```

---

### POST /categories

Create a new category.

**Request Body:**

```json
{
  "name": "Nueva Categoría",
  "slug": "nueva-categoria",
  "description": "Descripción de la categoría",
  "image": null
}
```

---

### PUT /categories/:id

Update a category.

---

### DELETE /categories/:id

Delete a category (fails if category has products).

---

## Presentations

### GET /presentations

Get all 24 canonical presentations (sorted by sortOrder).

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "6931cb2869446dbf6c881f56",
      "qty": 35,
      "unit": "g",
      "pretty": "35 g",
      "sortOrder": 1,
      "productCount": 1,
      "image": null
    },
    {
      "_id": "6931cb2869446dbf6c881f72",
      "qty": 1,
      "unit": "kg",
      "pretty": "1 kg",
      "sortOrder": 7,
      "productCount": 148,
      "image": null
    }
  ]
}
```

---

### GET /presentations/:id

Get a single presentation by ID.

---

### GET /presentations/:id/products

Get all products with this presentation.

**Query Parameters:**

- `page` (number, default: 1)
- `limit` (number, default: 20)

---

### POST /presentations

Create a new canonical presentation.

**Request Body:**

```json
{
  "qty": 2,
  "unit": "kg",
  "pretty": "2 kg",
  "sortOrder": 25,
  "image": null
}
```

---

### PUT /presentations/:id

Update a presentation.

---

### DELETE /presentations/:id

Delete a presentation (fails if used by products).

---

### PATCH /presentations/:id/image

Update presentation image.

**Request Body:**

```json
{
  "image": {
    "url": "https://example.com/image.jpg",
    "alt": "1 kg presentation",
    "width": 800,
    "height": 600
  }
}
```

---

### POST /presentations/sync-counts

Sync product counts for all presentations.

**Response:**

```json
{
  "success": true,
  "message": "Product counts synced successfully",
  "data": [
    {
      "id": "6931cb2869446dbf6c881f72",
      "pretty": "1 kg",
      "productCount": 148
    }
  ]
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common HTTP Status Codes:**

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Banners

### GET /banners

Get all banners.

**Query Parameters:**

- `placement` (string) - Filter by placement
- `active` (boolean) - Filter by active status

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Black Friday Sale",
      "image": {
        "url": "https://example.com/banner.jpg",
        "alt": "Black Friday Sale"
      },
      "link": {
        "url": "/products?category=ofertas",
        "openInNewTab": false
      },
      "placement": "homepage-hero",
      "active": true,
      "sortOrder": 1,
      "impressions": 1250,
      "clicks": 85
    }
  ]
}
```

---

### GET /banners/active/:placement

Get active banners for a specific placement (respects date ranges).

**Placements:**

- `homepage-hero` - Main hero banner
- `homepage-top` - Top of homepage
- `homepage-middle` - Middle of homepage
- `homepage-bottom` - Bottom of homepage
- `products-top` - Top of products page
- `category-top` - Top of category pages
- `global` - Shows everywhere

**Example:**

```bash
GET /api/qi/banners/active/homepage-hero
```

---

### GET /banners/:id

Get a single banner by ID.

---

### POST /banners

Create a new banner.

**Request Body:**

```json
{
  "title": "Summer Sale",
  "image": {
    "url": "https://example.com/summer-banner.jpg",
    "alt": "Summer Sale - Up to 50% off",
    "width": 1920,
    "height": 600
  },
  "link": {
    "url": "/products?sale=true",
    "openInNewTab": false
  },
  "placement": "homepage-hero",
  "active": true,
  "startDate": "2024-06-01T00:00:00Z",
  "endDate": "2024-08-31T23:59:59Z",
  "sortOrder": 1,
  "overlay": {
    "title": "Summer Sale",
    "subtitle": "Up to 50% off selected products",
    "buttonText": "Shop Now",
    "textColor": "#FFFFFF",
    "backgroundColor": "rgba(0,0,0,0.5)"
  }
}
```

---

### PUT /banners/:id

Update a banner.

---

### DELETE /banners/:id

Delete a banner.

---

### PATCH /banners/:id/toggle

Toggle banner active status.

---

### POST /banners/:id/impression

Track a banner impression (for analytics).

---

### POST /banners/:id/click

Track a banner click (for analytics).

---

## Data Models

### Product

```typescript
{
  _id: ObjectId
  sourceId?: number
  title: string
  slug: string
  sku?: string
  brand?: string
  status: 'draft' | 'published'
  featured: boolean
  publishedAt?: Date
  categoryIds: ObjectId[]
  presentationIds: ObjectId[]
  tags: string[]
  description_html?: string
  description_text?: string
  short_html?: string
  short_text?: string
  seo: {
    title?: string
    description?: string
    keywords?: string[]
  }
  images: Image[]
  media: {
    hero?: Image
    gallery: Image[]
  }
  views: number
  searches: number
  totalQuotes: number
  stock_status?: string
  ai: {
    description?: string
    shortDescription?: string
    seoTitle?: string
    seoDescription?: string
  }
  createdAt: Date
  updatedAt: Date
}
```

### Category

```typescript
{
  _id: ObjectId
  name: string
  slug: string
  parentId?: ObjectId
  image?: Image
  description?: string
  legacy: boolean
  sourceId?: number
  createdAt: Date
  updatedAt: Date
}
```

### CanonicalPresentation

```typescript
{
  _id: ObjectId
  qty: number
  unit: string
  pretty: string
  image?: Image
  sortOrder: number
  productCount: number
  createdAt: Date
  updatedAt: Date
}
```

### Banner

```typescript
{
  _id: ObjectId
  title: string
  image: Image
  link?: {
    url: string
    openInNewTab: boolean
  }
  placement: 'homepage-hero' | 'homepage-top' | 'homepage-middle' |
             'homepage-bottom' | 'products-top' | 'category-top' | 'global'
  active: boolean
  startDate?: Date
  endDate?: Date
  sortOrder: number
  overlay?: {
    title: string
    subtitle: string
    buttonText: string
    textColor: string
    backgroundColor: string
  }
  impressions: number
  clicks: number
  createdAt: Date
  updatedAt: Date
}
```

### Image

```typescript
{
  url: string
  alt: string
  width?: number
  height?: number
  hash?: string
}
```

---

## Testing

Run the test suite:

```bash
node test-qi-api.js
```

---

## Notes

- All product queries automatically populate `categoryIds` and `presentationIds`
- Text search is available on product `title` and `description_text` fields
- Presentations are sorted by `sortOrder` (smallest to largest)
- Categories exclude legacy WooCommerce categories by default
- Product counts are cached in presentations for performance
