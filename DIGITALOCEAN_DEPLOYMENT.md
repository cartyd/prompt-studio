# DigitalOcean Deployment Guide

## Prerequisites

1. A DigitalOcean account
2. This repository pushed to GitHub

## Deployment Steps

### 1. Deploy via App Platform

1. Go to DigitalOcean Dashboard → Apps
2. Click "Create App"
3. Select GitHub as the source and authorize DigitalOcean
4. Select the `cartyd/prompt-studio` repository
5. Choose the branch to deploy (main/master)
6. App Platform will auto-detect the Dockerfile
7. **IMPORTANT**: In Resources, add a persistent volume:
   - Mount Path: `/app/prisma/data`
   - Size: 1GB (sufficient for SQLite)
   - This ensures your database persists across deployments

### 2. Configure Environment Variables

In the App Platform settings, add these environment variables:

```
DATABASE_URL=file:/app/prisma/data/prod.db
SESSION_SECRET=<generate-a-strong-random-secret>
PORT=8080
NODE_ENV=production
```

**Important Notes:**
- Generate a strong SESSION_SECRET (at least 32 random characters): `openssl rand -base64 32`
- DigitalOcean App Platform uses PORT 8080 by default
- The SQLite database file will be stored in the persistent volume

### 3. Deploy

1. Review the configuration
2. Click "Create Resources"
3. App Platform will build and deploy your app
4. Migrations will run automatically on startup

### 4. Access Your App

Once deployed, DigitalOcean will provide a URL like:
`https://your-app-name-xxxxx.ondigitalocean.app`

## Continuous Deployment

App Platform automatically redeploys when you push to your GitHub repository.

## Cost Estimate

- Basic App with 1GB volume: $5-7/month
- No database needed (SQLite runs in-app)
- Total: ~$5-7/month

## Troubleshooting

### Check Logs
Go to App Platform → Your App → Runtime Logs

### Database Issues
Ensure the persistent volume is mounted at `/app/prisma/data` and DATABASE_URL points to that location

### Migration Errors
The app runs `prisma migrate deploy` on startup. Check logs if migrations fail.

## Alternative: Deploy to Droplet (VPS)

If you prefer more control:

1. Create a Docker-enabled Droplet
2. SSH into the droplet
3. Clone your repository
4. Create a `.env` file with production values
5. Run:
   ```bash
   docker build -t prompt-studio .
   docker run -d -p 80:3000 --env-file .env prompt-studio
   ```

## Security Recommendations

1. Enable App Platform's rate limiting
2. Use strong SESSION_SECRET
3. Enable database connection pooling
4. Consider adding SSL/TLS for database connections
5. Set up monitoring and alerts
