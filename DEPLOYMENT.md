# Vercel Deployment Guide

## Environment Variables

After deploying to Vercel, add these environment variables in your Vercel project settings:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
NODE_ENV=production
```

## Deployment Steps

1. Install Vercel CLI (if not already installed):
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. For production deployment:
```bash
vercel --prod
```

## Important Notes

- The `vercel.json` file configures the serverless deployment
- Environment variables must be set in Vercel dashboard
- MongoDB connection string should use MongoDB Atlas (cloud)
- The root route `/` now returns API information
- All API routes are under `/api/auth`

## Testing Deployment

After deployment, test these endpoints:
- `GET /` - API information
- `GET /test` - Server and database status
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
