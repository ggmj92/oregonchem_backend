# Química Industrial Backend API

Production-ready Express.js API serving the Química Industrial website with MongoDB and Firebase authentication.

## 🚀 Features

- **QI MongoDB API** - RESTful API for products, categories, presentations, and banners
- **Firebase Authentication** - Secure admin authentication for dashboard
- **AI Image Generation** - Gemini-powered category and presentation images
- **Quote Management** - Public quote submission system
- **CORS Configured** - Ready for production deployment

## 📁 Project Structure

```
oregonchem_backend/
├── src/
│   ├── config/
│   │   ├── qiDatabase.js          # QI MongoDB connection
│   │   ├── firebaseAdmin.js       # Firebase Admin SDK
│   │   └── firebaseAdminInit.js   # Firebase initialization
│   ├── controllers/
│   │   └── QI/
│   │       ├── ProductController.js
│   │       ├── CategoryController.js
│   │       ├── PresentationController.js
│   │       └── BannerController.js
│   ├── models/
│   │   └── QI/
│   │       ├── Product.js
│   │       ├── Category.js
│   │       ├── CanonicalPresentation.js
│   │       └── Banner.js
│   └── routes/
│       ├── qiRoutes.js            # QI API routes
│       ├── authRoutes.js          # Firebase auth routes
│       ├── quoteRoutes.js         # Quote submission
│       └── aiImageRoutes.js       # AI image generation
├── app.js                         # Express app configuration
└── package.json

```

## 🔧 Environment Variables

Create a `.env` file:

```env
# Server
NODE_ENV=development
PORT=5001

# MongoDB (Local Development)
MONGODB_URI=mongodb://localhost:27017/qi

# MongoDB (Production - Render.com)
MONGODB_URI_PROD=mongodb+srv://username:password@cluster.mongodb.net/qi

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# Google Gemini (for AI image generation)
GEMINI_API_KEY=your-gemini-api-key
```

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## 🌐 API Endpoints

### QI MongoDB API (`/api/qi`)

#### Products

- `GET /api/qi/products` - Get all products (with filters, search, pagination)
- `GET /api/qi/products/:id` - Get product by ID
- `GET /api/qi/products/slug/:slug` - Get product by slug
- `GET /api/qi/products/:id/related` - Get related products
- `GET /api/qi/products/featured` - Get featured products

#### Categories

- `GET /api/qi/categories` - Get all categories
- `GET /api/qi/categories/:id` - Get category by ID
- `GET /api/qi/categories/slug/:slug` - Get category by slug

#### Presentations

- `GET /api/qi/presentations` - Get all presentations
- `GET /api/qi/presentations/:id` - Get presentation by ID

#### Banners

- `GET /api/qi/banners` - Get all banners
- `GET /api/qi/banners/active/:location` - Get active banner for location

### Authentication (`/auth`)

- `POST /auth/verify` - Verify Firebase ID token

### Quotes (`/api/public/quotes`)

- `POST /api/public/quotes` - Submit a quote request

### AI Images (`/api/ai-images`)

- `POST /api/ai-images/generate` - Generate AI images (requires auth)

### Health Check

- `GET /api/health` - Server health status

## 🗄️ Database Schema

### Product

```javascript
{
  _id: ObjectId,
  sourceId: Number,
  title: String,
  slug: String,
  sku: String,
  status: 'draft' | 'published',
  featured: Boolean,
  categoryIds: [ObjectId],
  presentationIds: [ObjectId],
  relatedProductIds: [ObjectId],
  relatedProducts: [{
    productId: ObjectId,
    reason: String  // AI-generated relationship reasoning
  }],
  description_html: String,
  description_text: String,
  seo: { title, description, keywords },
  media: { hero, gallery },
  images: [{ url, alt, width, height }],
  ai: {
    description: String,
    shortDescription: String,
    seoTitle: String,
    seoDescription: String,
    physicalStateReasoning: String
  },
  physicalState: String,
  views: Number,
  searches: Number,
  totalQuotes: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## 🚢 Deployment

### Vercel (Recommended)

1. **Install Vercel CLI**:

   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:

   ```bash
   vercel login
   ```

3. **Deploy**:

   ```bash
   vercel --prod
   ```

4. **Add Environment Variables** in Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env`
   - Redeploy after adding variables

### Render.com (Alternative)

1. **Create Web Service** on Render.com
2. **Connect GitHub repository**
3. **Configure**:
   - Build Command: `npm install`
   - Start Command: `node app.js`
4. **Add Environment Variables** from `.env`
5. **Deploy**!

## 🔒 Security

- Firebase Admin SDK for authentication
- CORS configured for allowed origins
- Environment variables for sensitive data
- MongoDB connection with authentication

## 📝 Development

```bash
# Run with nodemon (auto-restart)
npm run dev

# Test QI API
node test-qi-api.js

# Check health
curl http://localhost:5001/api/health
```

## 🤝 Related Projects

- **Frontend**: `quimicaindustrial-frontend` (Astro)
- **Migrator**: `qi-woocommerce-product-migrator` (Data migration & AI scripts)

## 📄 License

Private - Química Industrial Perú

---

**Built with ❤️ for Química Industrial**
