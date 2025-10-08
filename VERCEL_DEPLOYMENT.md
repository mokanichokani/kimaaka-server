# 🚀 Vercel Deployment Guide - Kimaaka Server

This guide will help you deploy the Kimaaka Next.js API server to Vercel.

## 📋 Prerequisites

- Vercel account (free tier available)
- GitHub repository with the server code
- MongoDB database (MongoDB Atlas recommended)
- Google Gemini API key

## 🔧 Environment Variables

Set these environment variables in your Vercel dashboard:

### Required Variables
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kimaaka-server
JWT_SECRET=your-super-secret-jwt-key-here
```

### Optional Variables
```bash
RENDER_EXTERNAL_URL=http://localhost:3000
NODE_ENV=production
```

## 🚀 Deployment Steps

### 1. Connect Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the `server` folder as the root directory

### 2. Configure Build Settings
- **Framework Preset**: Next.js
- **Root Directory**: `server`
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (auto-detected)

### 3. Set Environment Variables
1. Go to Project Settings → Environment Variables
2. Add all required environment variables listed above
3. Make sure to set them for Production, Preview, and Development

### 4. Deploy
1. Click "Deploy"
2. Wait for the build to complete
3. Your server will be available at `http://localhost:3000`

## 🔗 API Endpoints

Once deployed, your API will be available at:

### Public Endpoints
- `GET http://localhost:3000/api/health` - Health check
- `GET http://localhost:3000/api/gemini-key` - Get API key
- `POST http://localhost:3000/api/donate-key` - Donate API key

### Admin Endpoints (require authentication)
- `POST http://localhost:3000/api/admin/auth/login` - Admin login
- `GET http://localhost:3000/api/admin/stats` - Get statistics
- `GET http://localhost:3000/api/admin/api-keys` - Manage API keys

## 🔄 URL Rewrites

The `vercel.json` file includes rewrites for backward compatibility:
- `/gemini-key` → `/api/gemini-key`
- `/donate-key` → `/api/donate-key`

## 🧪 Testing Deployment

### 1. Health Check
```bash
curl http://localhost:3000/api/health
```

### 2. Test API Key Endpoint
```bash
curl http://localhost:3000/api/gemini-key
```

### 3. Test Donation Endpoint
```bash
curl -X POST http://localhost:3000/api/donate-key \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "your-gemini-api-key", "donorEmail": "test@example.com"}'
```

## 🔧 Configuration Updates

After deployment, update these files in your client applications:

### Chrome Extension
- Update `extension/extension/config.js` with your Vercel URL
- Update `extension/extension/manifest.json` host permissions

### Admin Dashboard
- Update `dashboard/config.js` with your Vercel URL
- Update `extension/admin-dashboard/config.js` with your Vercel URL

## 📊 Monitoring

Vercel provides built-in monitoring:
- Function execution logs
- Performance metrics
- Error tracking
- Usage analytics

## 🔒 Security

- All API endpoints include CORS headers
- Admin endpoints require JWT authentication
- Environment variables are encrypted
- HTTPS is enabled by default

## 🆘 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all dependencies are in `package.json`
   - Verify TypeScript compilation
   - Check environment variables

2. **Database Connection Issues**
   - Verify MongoDB URI format
   - Check network access in MongoDB Atlas
   - Ensure database user has proper permissions

3. **API Key Issues**
   - Verify Gemini API key is valid
   - Check API key permissions
   - Monitor usage quotas

### Debug Commands

```bash
# Check build locally
npm run build

# Test API routes locally
npm run dev

# Check environment variables
vercel env ls
```

## 📈 Scaling

Vercel automatically handles:
- Serverless scaling
- Global CDN distribution
- Automatic HTTPS
- Zero-downtime deployments

## 🔄 Updates

To update your deployment:
1. Push changes to your GitHub repository
2. Vercel automatically triggers a new deployment
3. Changes are live within minutes

---

**Your Kimaaka server is now ready for production! 🎉**
