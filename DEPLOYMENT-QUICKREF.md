# Deployment Quick Reference

## Files Created for Deployment

| File | Purpose |
|------|---------|
| `DEPLOYMENT.md` | Complete deployment guide with detailed instructions |
| `.deployment-checklist.md` | Step-by-step checklist for deployment |
| `setup-droplet.sh` | Automated initial Droplet setup (run once) |
| `deploy.sh` | Update deployment script (run for each update) |
| `ecosystem.config.js` | PM2 process manager configuration |
| `nginx-config` | nginx reverse proxy configuration |

## Quick Commands

### First-Time Deployment

```bash
# 1. Create Droplet on DigitalOcean (Ubuntu 22.04)
# 2. SSH into Droplet
ssh root@YOUR_DROPLET_IP

# 3. Clone and setup
git clone https://github.com/cartyd/prompt-studio.git /var/www/prompt-studio
cd /var/www/prompt-studio
chmod +x setup-droplet.sh
./setup-droplet.sh

# 4. Update nginx config with your domain/IP
nano /etc/nginx/sites-available/prompt-studio

# 5. Restart nginx
systemctl reload nginx
```

### Deploying Updates

```bash
# Push changes to GitHub first
git add .
git commit -m "Your changes"
git push

# Then on Droplet
ssh root@YOUR_DROPLET_IP
cd /var/www/prompt-studio
./deploy.sh
```

### Useful Commands

```bash
# Application
pm2 status                    # Check app status
pm2 logs prompt-studio        # View logs
pm2 restart prompt-studio     # Restart app
pm2 stop prompt-studio        # Stop app

# Server
systemctl status nginx        # Check nginx
nginx -t                      # Test nginx config
systemctl reload nginx        # Reload nginx

# Database
ls -la prisma/data/           # Check database
npm run prisma:studio         # Open database GUI (use SSH tunnel)

# Monitoring
htop                          # System resources
df -h                         # Disk space
ufw status                    # Firewall status
```

### SSH Tunnel for Prisma Studio

```bash
# On local machine
ssh -L 5555:localhost:5555 root@YOUR_DROPLET_IP

# On Droplet (in another terminal)
cd /var/www/prompt-studio
npm run prisma:studio

# Visit http://localhost:5555 in local browser
```

### Backup Database

```bash
# Manual backup
cp /var/www/prompt-studio/prisma/data/prod.db \
   /root/backups/prod-$(date +%Y%m%d).db

# Automated backup (add to crontab -e)
0 2 * * * cp /var/www/prompt-studio/prisma/data/prod.db /root/backups/prod-$(date +\%Y\%m\%d).db
```

### SSL Setup (if using domain)

```bash
# Install certbot
apt install -y certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically by certbot
```

## Environment Variables

Located at `/var/www/prompt-studio/.env`:

```bash
DATABASE_URL="file:./prisma/data/prod.db"
SESSION_SECRET="generated-by-setup-script"
PORT=3000
NODE_ENV=production
```

## Troubleshooting

```bash
# App won't start
pm2 logs prompt-studio --lines 100
cat /var/www/prompt-studio/.env

# nginx errors
nginx -t
tail -f /var/log/nginx/error.log

# Database issues
ls -la /var/www/prompt-studio/prisma/data/
npm run prisma:generate
npm run prisma:migrate:deploy

# Out of disk space
df -h
du -sh /var/www/prompt-studio/*
# Clean up old logs
pm2 flush
```

## Rollback

```bash
cd /var/www/prompt-studio
git log --oneline -5
git checkout PREVIOUS_COMMIT_HASH
./deploy.sh
```

## Cost

- **Droplet**: $6-12/month
- **Domain**: ~$12/year (optional)
- **SSL**: Free (Let's Encrypt)

## Support

- Full guide: See `DEPLOYMENT.md`
- Checklist: See `.deployment-checklist.md`
- DigitalOcean Docs: https://docs.digitalocean.com/
