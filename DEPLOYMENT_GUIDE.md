# Backend Deployment Guide

## 📋 Pre-Deployment Checklist

- [x] Clean up old DB references
- [x] All routes use QI MongoDB
- [x] CORS configured for frontend & dashboard
- [x] Vercel configuration files created
- [x] Code pushed to GitHub

## 🚀 Vercel Deployment Steps

### 1. Deploy Backend

```bash
cd /Users/ggmj/Development/OregonChemDigital/oregonchem_backend
vercel --prod
```

**Follow prompts:**

- Set up and deploy? **Yes**
- Which scope? **Select your account**
- Link to existing project? **No** (first time) or **Yes** (subsequent)
- Project name? **oregonchem-backend** (or your choice)
- Directory? **./** (current directory)
- Override settings? **No**

### 2. Add Environment Variables

After deployment, go to Vercel Dashboard:

1. **Navigate to**: https://vercel.com/dashboard
2. **Select project**: oregonchem-backend
3. **Go to**: Settings → Environment Variables
4. **Add these variables**:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/qi
MONGODB_URI_PROD=mongodb+srv://username:password@cluster.mongodb.net/qi

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# Optional
GEMINI_API_KEY=your-gemini-api-key
NODE_ENV=production
```

5. **Save** and **Redeploy**

### 3. Get Your Backend URL

After deployment completes, you'll get a URL like:

```
https://oregonchem-backend.vercel.app
```

**Save this URL!** You'll need it for frontend and dashboard.

## 🔗 Connect Frontend

### Update Frontend Environment

1. **Edit** `/Users/ggmj/Development/quimicaindustrial-frontend/.env`:

```env
PUBLIC_QI_API_URL=https://oregonchem-backend.vercel.app/api/qi
```

2. **Or update** `src/data/qiApi.ts`:

```typescript
const QI_API_BASE_URL =
  import.meta.env.PUBLIC_QI_API_URL ||
  "https://oregonchem-backend.vercel.app/api/qi";
```

3. **Test locally**:

```bash
cd /Users/ggmj/Development/quimicaindustrial-frontend
npm run dev
```

4. **Deploy frontend**:

```bash
vercel --prod
```

## 🎛️ Connect Dashboard

### Update Dashboard Environment

1. **Edit dashboard** `.env` or config:

```env
VITE_API_URL=https://oregonchem-backend.vercel.app
```

2. **Test locally**
3. **Deploy dashboard**:

```bash
vercel --prod
```

## ✅ Verification

### Test Backend Endpoints

```bash
# Health check
curl https://oregonchem-backend.vercel.app/api/health

# Get products
curl https://oregonchem-backend.vercel.app/api/qi/products

# Get categories
curl https://oregonchem-backend.vercel.app/api/qi/categories
```

### Test Frontend Connection

1. Visit your frontend URL
2. Check browser console for API calls
3. Verify products load correctly
4. Test related products with AI reasoning

### Test Dashboard Connection

1. Visit dashboard URL
2. Login with Firebase
3. Verify data loads from backend
4. Test CRUD operations

## 🐛 Troubleshooting

### CORS Errors

If you see CORS errors:

1. **Check** `app.js` has correct origins
2. **Add** your specific Vercel URLs to `allowedOrigins`
3. **Redeploy** backend

### MongoDB Connection Errors

1. **Verify** `MONGODB_URI_PROD` is correct
2. **Check** MongoDB Atlas allows Vercel IPs
3. **Whitelist** `0.0.0.0/0` in MongoDB Atlas (or specific Vercel IPs)

### Environment Variables Not Working

1. **Go to** Vercel Dashboard → Settings → Environment Variables
2. **Verify** all variables are set
3. **Click** "Redeploy" button (don't just push code)

### Firebase Auth Errors

1. **Check** `FIREBASE_PRIVATE_KEY` has `\n` characters
2. **Verify** Firebase project ID is correct
3. **Test** with `/api/health` endpoint

## 📊 Monitoring

### Vercel Dashboard

- **Deployments**: See all deployments
- **Functions**: Monitor serverless function performance
- **Analytics**: Track API usage
- **Logs**: Real-time logs for debugging

### MongoDB Atlas

- **Metrics**: Database performance
- **Alerts**: Set up alerts for issues
- **Backup**: Configure automated backups

## 🔄 Redeployment

### When to Redeploy

- Code changes pushed to GitHub
- Environment variables updated
- Configuration changes

### How to Redeploy

```bash
# Option 1: CLI
vercel --prod

# Option 2: Dashboard
# Go to Vercel Dashboard → Deployments → Redeploy
```

## 🎯 Production URLs

After deployment, update these everywhere:

**Backend API**:

```
https://oregonchem-backend.vercel.app
```

**Frontend**:

```
https://quimicaindustrial-frontend.vercel.app
```

**Dashboard**:

```
https://oregonchem-dashboard.vercel.app
```

## 📝 Post-Deployment Tasks

- [ ] Test all API endpoints
- [ ] Verify frontend loads products
- [ ] Test dashboard CRUD operations
- [ ] Check related products with AI reasoning
- [ ] Test quote submission
- [ ] Monitor logs for errors
- [ ] Set up custom domain (optional)
- [ ] Configure SSL (automatic with Vercel)
- [ ] Set up monitoring/alerts

---

**Deployment Date**: December 5, 2025
**Status**: ✅ Ready for Production
