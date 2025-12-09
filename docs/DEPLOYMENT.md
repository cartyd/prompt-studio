# Deployment Guide - DigitalOcean

This guide walks you through deploying prompt-studio to a DigitalOcean Droplet.

## Prerequisites

- DigitalOcean account
- SSH key configured in your DigitalOcean account
- (Optional) Domain name for SSL/HTTPS

## Step 1: Create a Droplet

1. Log in to DigitalOcean
2. Click "Create" → "Droplets"
3. Choose:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic (Minimum $6/month - 1GB RAM, 1 vCPU)
   - **Datacenter**: Choose region closest to your users
   - **Authentication**: Select your SSH key
   - **Hostname**: `prompt-studio` (or your preference)
4. Click "Create Droplet"
5. Note your Droplet's IP address

## Step 2: Initial Setup

SSH into your Droplet:

```bash
ssh root@YOUR_DROPLET_IP
```

Copy the setup script to your Droplet:

```bash
# On your local machine
scp setup-droplet.sh nginx.conf ecosystem.config.js root@YOUR_DROPLET_IP:/root/
```

Or clone the repository and run the setup script:

```bash
# On the Droplet
cd /root
git clone https://github.com/cartyd/prompt-studio.git temp-setup
cd temp-setup
chmod +x setup-droplet.sh
./setup-droplet.sh
```

The setup script will:
- Update system packages
- Install Node.js 18.x, PM2, and nginx
- Clone your repository
- Install dependencies
- Generate Prisma client
- Create production `.env` file with random SESSION_SECRET
- Run database migrations
- Build the application
- Start the app with PM2
- Configure nginx as reverse proxy
- Set up firewall rules

## Step 3: Configure Domain (Optional)

If using a domain name:

1. Update nginx configuration:

```bash
nano /etc/nginx/sites-available/prompt-studio
# Change server_name from 'your-domain.com' to your actual domain
```

2. Point your domain's DNS A record to your Droplet's IP

3. Test nginx config and reload:

```bash
nginx -t
systemctl reload nginx
```

## Step 4: Set up SSL (Optional but Recommended)

If you have a domain:

```bash
# Install certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d your-domain.com

# Certbot will automatically update nginx config
```

## Step 5: Verify Deployment

Visit your application:
- Without domain: `http://YOUR_DROPLET_IP`
- With domain: `http://your-domain.com`
- With SSL: `https://your-domain.com`

Check application status:

```bash
pm2 status
pm2 logs prompt-studio
```

## Updating Your Application

After pushing changes to GitHub:

```bash
# SSH into your Droplet
ssh root@YOUR_DROPLET_IP

# Run deployment script
cd /var/www/prompt-studio
./deploy.sh
```

The deploy script will:
- Pull latest code
- Install dependencies
- Regenerate Prisma client
- Run migrations
- Rebuild TypeScript
- Restart the application

## Useful Commands

### Application Management
```bash
pm2 status                  # Check status
pm2 logs prompt-studio      # View logs
pm2 restart prompt-studio   # Restart app
pm2 stop prompt-studio      # Stop app
pm2 start prompt-studio     # Start app
```

### Nginx Management
```bash
systemctl status nginx      # Check nginx status
systemctl restart nginx     # Restart nginx
nginx -t                    # Test config
tail -f /var/log/nginx/prompt-studio-access.log  # View access logs
tail -f /var/log/nginx/prompt-studio-error.log   # View error logs
```

### Database
```bash
cd /var/www/prompt-studio
npm run prisma:studio       # Open Prisma Studio (requires SSH tunnel)
```

To access Prisma Studio from your local machine:

```bash
# On your local machine, create SSH tunnel
ssh -L 5555:localhost:5555 root@YOUR_DROPLET_IP

# On the Droplet
cd /var/www/prompt-studio
npm run prisma:studio
```

Then visit `http://localhost:5555` on your local browser.

## Backup

Backup your SQLite database:

```bash
# Create backup
cp /var/www/prompt-studio/prisma/data/prod.db /root/backups/prod-$(date +%Y%m%d).db

# Or set up automated daily backups with cron
crontab -e
# Add: 0 2 * * * cp /var/www/prompt-studio/prisma/data/prod.db /root/backups/prod-$(date +\%Y\%m\%d).db
```

## Troubleshooting

### Application won't start
```bash
pm2 logs prompt-studio      # Check error logs
cat /var/www/prompt-studio/.env  # Verify environment variables
```

### nginx errors
```bash
nginx -t                    # Test configuration
systemctl status nginx
tail -f /var/log/nginx/error.log
```

### Database issues
```bash
# Check database file exists
ls -la /var/www/prompt-studio/prisma/data/

# Verify permissions
ls -la /var/www/prompt-studio/prisma/data/prod.db

# Regenerate database (CAUTION: deletes all data)
cd /var/www/prompt-studio
rm prisma/data/prod.db
npm run prisma:migrate deploy
```

### Out of memory
Upgrade your Droplet to a larger size in the DigitalOcean control panel.

## Security Considerations

1. **Change SESSION_SECRET**: Update in `/var/www/prompt-studio/.env` after setup
2. **Regular updates**: Run `apt update && apt upgrade` periodically
3. **Firewall**: UFW is enabled, only SSH and HTTP/HTTPS are allowed
4. **SSL**: Use certbot for free SSL certificates
5. **Database backups**: Set up automated backups
6. **Monitor logs**: Regularly check PM2 and nginx logs

## Cost Estimate

- **Minimum**: $6/month (1GB RAM)
- **Recommended**: $12/month (2GB RAM) for better performance
- **Domain**: ~$10-15/year (optional)
- **SSL**: Free with Let's Encrypt
