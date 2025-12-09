#!/bin/bash

# Initial setup script for DigitalOcean Droplet
# Run this ONCE on a fresh Ubuntu 22.04 Droplet as root

set -e

echo "🔧 Starting DigitalOcean Droplet setup for prompt-studio..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18.x
echo "📦 Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify Node.js installation
node -v
npm -v

# Install PM2 globally
echo "📦 Installing PM2..."
npm install -g pm2

# Install nginx
echo "📦 Installing nginx..."
apt install -y nginx

# Configure firewall
echo "🔒 Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Create app directory
echo "📁 Creating application directory..."
mkdir -p /var/www/prompt-studio
cd /var/www/prompt-studio

# Clone repository
echo "📥 Cloning repository..."
git clone https://github.com/cartyd/prompt-studio.git .

# Install dependencies
echo "📦 Installing application dependencies..."
npm install --production

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p prisma/data

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run prisma:generate

# Create .env file
echo "⚙️  Creating environment file..."
cat > .env << EOF
DATABASE_URL="file:./prisma/data/prod.db"
SESSION_SECRET="$(openssl rand -base64 32)"
PORT=3000
NODE_ENV=production
EOF

echo "⚠️  IMPORTANT: Review and update /var/www/prompt-studio/.env if needed"

# Run database migrations
echo "🗄️  Running database migrations..."
npm run prisma:migrate:deploy

# Build application
echo "🔨 Building application..."
npm run build

# Set proper permissions
echo "🔒 Setting permissions..."
chown -R www-data:www-data /var/www/prompt-studio
chmod -R 755 /var/www/prompt-studio
chmod 600 /var/www/prompt-studio/.env

# Start application with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 startup systemd -u root --hp /root
pm2 save

# Configure nginx
echo "🌐 Configuring nginx..."
cp nginx.conf /etc/nginx/sites-available/prompt-studio
ln -sf /etc/nginx/sites-available/prompt-studio /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Restart nginx
systemctl restart nginx
systemctl enable nginx

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update SERVER_NAME in /etc/nginx/sites-available/prompt-studio"
echo "2. Review environment variables in /var/www/prompt-studio/.env"
echo "3. Test your application at http://YOUR_DROPLET_IP"
echo "4. (Optional) Set up SSL with: certbot --nginx -d your-domain.com"
echo ""
echo "📊 Useful commands:"
echo "  pm2 status              - Check application status"
echo "  pm2 logs prompt-studio  - View application logs"
echo "  pm2 restart prompt-studio - Restart application"
echo "  systemctl status nginx  - Check nginx status"
