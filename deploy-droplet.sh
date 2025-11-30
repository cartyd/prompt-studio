#!/bin/bash
set -e

echo "🚀 Deploying Prompt Studio to DigitalOcean Droplet..."

# Configuration
DROPLET_NAME="prompt-studio"
DROPLET_SIZE="s-1vcpu-1gb"
DROPLET_IMAGE="docker-20-04"
DROPLET_REGION="nyc3"

# Check if droplet already exists
echo "📡 Checking for existing droplet..."
DROPLET_IP=$(doctl compute droplet list --format Name,PublicIPv4 --no-header | grep "^${DROPLET_NAME}" | awk '{print $2}' || true)

if [ -z "$DROPLET_IP" ]; then
    echo "🆕 Creating new droplet..."
    doctl compute droplet create $DROPLET_NAME \
        --size $DROPLET_SIZE \
        --image $DROPLET_IMAGE \
        --region $DROPLET_REGION \
        --ssh-keys 52315576 \
        --wait
    
    # Get the IP address
    DROPLET_IP=$(doctl compute droplet list --format Name,PublicIPv4 --no-header | grep "^${DROPLET_NAME}" | awk '{print $2}')
    
    echo "⏳ Waiting for droplet to be ready..."
    # Wait for SSH to be available
    for i in {1..12}; do
        if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$DROPLET_IP "echo 'SSH ready'" 2>/dev/null; then
            echo "✅ SSH connection established"
            break
        fi
        echo "   Attempt $i/12: SSH not ready yet, waiting 10 seconds..."
        sleep 10
    done
else
    echo "✅ Using existing droplet at $DROPLET_IP"
fi

echo "📦 Droplet IP: $DROPLET_IP"

# Generate session secret if not set
SESSION_SECRET=${SESSION_SECRET:-$(openssl rand -base64 32)}

echo "🔐 Session secret generated"
echo ""
echo "⚠️  IMPORTANT: Save this session secret for future deployments:"
echo "   export SESSION_SECRET=\"$SESSION_SECRET\""
echo ""

# Create deployment script for the droplet
cat > /tmp/deploy-app.sh << 'DEPLOY_SCRIPT'
#!/bin/bash
set -e

# Stop and remove existing container if running
docker stop prompt-studio 2>/dev/null || true
docker rm prompt-studio 2>/dev/null || true

# Pull latest code
if [ -d "/root/prompt-studio" ]; then
    cd /root/prompt-studio
    git pull
else
    git clone https://github.com/cartyd/prompt-studio.git /root/prompt-studio
    cd /root/prompt-studio
fi

# Build Docker image
docker build -t prompt-studio:latest .

# Create data directory for SQLite
mkdir -p /root/prompt-studio-data

# Run container
docker run -d \
    --name prompt-studio \
    --restart unless-stopped \
    -p 80:3000 \
    -v /root/prompt-studio-data:/app/prisma/data \
    -e DATABASE_URL="file:/app/prisma/data/prod.db" \
    -e SESSION_SECRET="$SESSION_SECRET" \
    -e PORT=3000 \
    -e NODE_ENV=production \
    prompt-studio:latest

echo "✅ Deployment complete!"
DEPLOY_SCRIPT

# Copy and execute deployment script on droplet
echo "📤 Deploying application to droplet..."
scp -o StrictHostKeyChecking=no /tmp/deploy-app.sh root@$DROPLET_IP:/tmp/
ssh -o StrictHostKeyChecking=no root@$DROPLET_IP "export SESSION_SECRET='$SESSION_SECRET' && bash /tmp/deploy-app.sh"

echo ""
echo "🎉 Deployment successful!"
echo ""
echo "🌐 Your app is running at: http://$DROPLET_IP"
echo ""
echo "📝 To check logs:"
echo "   ssh root@$DROPLET_IP 'docker logs -f prompt-studio'"
echo ""
echo "🔄 To redeploy after pushing changes:"
echo "   ./deploy-droplet.sh"
echo ""
