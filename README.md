# Next.js API Server - Kimaaka Gemini API Key Management

This is a Next.js-based API server that replicates all the functionality of the original Express server for managing Gemini API keys. It provides the same endpoints and features but built with Next.js App Router and TypeScript.

## 🚀 Features

- **API Key Management**: Round-robin allocation of Gemini API keys
- **User Authentication**: JWT-based authentication for users and admins
- **Admin Dashboard**: Comprehensive admin interface for managing API keys and users
- **Usage Tracking**: Detailed analytics and usage statistics
- **CORS Support**: Full CORS support for browser extensions and web apps
- **MongoDB Integration**: Persistent storage with Mongoose ODM
- **TypeScript**: Full type safety throughout the application

## 📋 API Endpoints

### Public Endpoints
- `GET /api/health` - Health check endpoint
- `GET /api/gemini-key` - Get API key using round-robin allocation
- `POST /api/donate-key` - Donate an API key

### User Authentication
- `POST /api/signup` - User registration
- `POST /api/login` - User login
- `GET /api/verify` - Verify JWT token
- `POST /api/logout` - User logout
- `POST /api/create-admin` - Create first admin user

### Admin Authentication
- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/auth/verify` - Verify admin token
- `GET /api/admin/auth/users` - Get all admin users
- `POST /api/admin/auth/users` - Create new admin user

### Admin Management
- `GET /api/admin/stats` - Get comprehensive statistics
- `GET /api/admin/api-keys` - Get all API keys
- `POST /api/admin/api-keys` - Add new API key
- `GET /api/admin/recent-activity` - Get recent activity
- `GET /api/admin/usage-statistics` - Get detailed usage statistics
- `GET /api/admin/server-usage` - Get server usage data

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- MongoDB database
- npm or yarn

### 1. Clone and Install Dependencies

```bash
cd nextjs-api-server
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/kimaaka-server

# JWT Secret for token generation
JWT_SECRET=your-super-secret-jwt-key-here

# Server Configuration
PORT=3000

# Optional: External URL for production
RENDER_EXTERNAL_URL=https://your-app.onrender.com
```

### 3. Database Setup

Make sure MongoDB is running and accessible at the URI specified in your environment variables.

### 4. Create Admin User

```bash
# Create default admin (username: admin, password: admin123)
npm run setup-admin

# Or create custom admin
npm run create-admin
```

### 5. Start the Server

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

The server will be available at `http://localhost:3000`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | Secret key for JWT tokens | Yes | - |
| `PORT` | Server port | No | 3000 |
| `RENDER_EXTERNAL_URL` | External URL for production | No | - |

### CORS Configuration

The server is configured to allow requests from:
- Chrome extensions (`chrome-extension://`)
- Firefox extensions (`moz-extension://`)
- Localhost development
- Admin dashboard domains
- All origins (configurable)

## 📊 Usage Examples

### Get API Key
```bash
curl -X GET http://localhost:3000/api/gemini-key
```

### Donate API Key
```bash
curl -X POST http://localhost:3000/api/donate-key \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "your-gemini-api-key", "donorEmail": "donor@example.com"}'
```

### User Login
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### Admin Login
```bash
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

## 🔄 Migration from Express Server

### Key Differences

1. **Framework**: Next.js App Router instead of Express
2. **File Structure**: API routes in `app/api/` directory
3. **TypeScript**: Full TypeScript support
4. **Database Connection**: Cached connection for better performance
5. **CORS**: Built-in CORS handling

### API Compatibility

All endpoints maintain the same:
- URL structure
- Request/response format
- Authentication methods
- Error handling

### Changes Required in Client Applications

**No changes required!** The API endpoints are identical to the original Express server. Your existing client applications should work without any modifications.

### Database Migration

The database schemas are identical, so you can:
1. Use the same MongoDB database
2. Keep existing data
3. No migration scripts needed

## 🏗️ Project Structure

```
nextjs-api-server/
├── src/
│   ├── app/
│   │   └── api/                 # API routes
│   │       ├── health/
│   │       ├── gemini-key/
│   │       ├── donate-key/
│   │       ├── signup/
│   │       ├── login/
│   │       ├── verify/
│   │       ├── logout/
│   │       ├── create-admin/
│   │       └── admin/
│   │           ├── auth/
│   │           ├── stats/
│   │           └── api-keys/
│   └── lib/
│       ├── mongodb.ts          # Database connection
│       ├── models.ts           # Mongoose schemas
│       ├── auth.ts             # Authentication utilities
│       ├── cors.ts             # CORS configuration
│       └── helpers.ts          # Helper functions
├── scripts/
│   ├── create-admin.js         # Create admin user
│   └── setup-admin.js          # Setup default admin
├── .env.local.example          # Environment variables template
├── next.config.js              # Next.js configuration
└── package.json
```

## 🚀 Deployment

### Vercel
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Render
1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy as a Web Service

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔍 Monitoring & Logging

The server includes comprehensive logging for:
- API key allocations
- Authentication attempts
- Error tracking
- Performance metrics
- Usage statistics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
1. Check the documentation
2. Review the API endpoints
3. Check the logs for errors
4. Create an issue in the repository

## 🔄 Updates

To update the server:
1. Pull the latest changes
2. Run `npm install` to update dependencies
3. Restart the server
4. Check for any breaking changes in the changelog