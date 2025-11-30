# DigitalOcean Deployment Guide

## Prerequisites

1. A DigitalOcean account
2. This repository pushed to GitHub
3. A PostgreSQL database (use DigitalOcean Managed Database)

## Deployment Steps

### 1. Create a Managed PostgreSQL Database

1. Go to DigitalOcean Dashboard → Databases
2. Create a new PostgreSQL database cluster
3. Choose your preferred region and plan (Basic plan starts at $15/mo)
4. Note down the connection string (you'll need this for DATABASE_URL)

### 2. Deploy via App Platform

1. Go to DigitalOcean Dashboard → Apps
2. Click "Create App"
3. Select GitHub as the source and authorize DigitalOcean
4. Select the `cartyd/prompt-studio` repository
5. Choose the branch to deploy (main/master)
6. App Platform will auto-detect the Dockerfile

### 3. Configure Environment Variables

In the App Platform settings, add these environment variables:

```
DATABASE_URL=postgresql://username:password@hostname:port/database?schema=public
SESSION_SECRET=<generate-a-strong-random-secret>
PORT=8080
NODE_ENV=production
```

**Important Notes:**
- Use the connection string from your DigitalOcean Managed Database
- Generate a strong SESSION_SECRET (at least 32 random characters)
- DigitalOcean App Platform uses PORT 8080 by default

### 4. Update Prisma Schema for PostgreSQL

Update `prisma/schema.prisma` datasource:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Commit and push this change.

### 5. Deploy

1. Click "Next" through the configuration
2. Review and click "Create Resources"
3. App Platform will build and deploy your app
4. Migrations will run automatically on startup (see Dockerfile CMD)

### 6. Access Your App

Once deployed, DigitalOcean will provide a URL like:
`https://your-app-name-xxxxx.ondigitalocean.app`

## Continuous Deployment

App Platform automatically redeploys when you push to your GitHub repository.

## Cost Estimate

- Basic App: $5-12/month
- PostgreSQL Database: $15/month (Basic)
- Total: ~$20-27/month

## Troubleshooting

### Check Logs
Go to App Platform → Your App → Runtime Logs

### Database Connection Issues
Ensure DATABASE_URL is correctly formatted and the database allows connections from App Platform

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
