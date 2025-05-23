#!/bin/bash
set -e
PROJECT_DIR="$1"
OLLAMA_SERVICE_IP="$2"
NODE_BIN="/usr/bin/npm" # Adjust if needed
UI_SERVICE="/etc/systemd/system"
ENV_FILE="/etc/systemd/system/ui.env"

echo "➡️ Starting Chatbot Ollama deployment..."

# Install Node.js if not present
if ! command -v npm &> /dev/null; then
  echo "📦 Installing Node.js..."
  sudo apt update
  sudo apt install -y curl
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi

# Navigate to the project
cd "$PROJECT_DIR"

# Install dependencies
echo "📥 Installing dependencies..."
$NODE_BIN install --legacy-peer-deps

# Install Prisma
echo "📥 Installing Prisma..."
$NODE_BIN install @prisma/client --legacy-peer-deps
$NODE_BIN install prisma --save-dev --legacy-peer-deps

# Create Prisma directory if it doesn't exist
mkdir -p prisma

# Initialize Prisma if schema doesn't exist
if [ ! -f "prisma/schema.prisma" ]; then
  echo "⚙️ Initializing Prisma schema..."
  npx prisma init
fi

# Generate Prisma client
echo "⚙️ Generating Prisma client..."
npx prisma generate

# Push the schema to the database
echo "⚙️ Pushing database schema..."
npx prisma db push

# Build the application
echo "🏗️ Building the application..."
$NODE_BIN run build

# Configure environment
echo "📄 Writing environment config..."
echo "OLLAMA_SERVICE_IP=$OLLAMA_SERVICE_IP" | sudo tee "$ENV_FILE" > /dev/null

# Update UI service configuration
echo "⚙️ Updating UI service..."
cat > ui.service << EOL
[Unit]
Description=UI Frontend Service
After=network.target

[Service]
User=ubuntu
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/npm run start -- --hostname 0.0.0.0
Restart=always
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production
EnvironmentFile=$ENV_FILE
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOL

# Copy service file
sudo cp ui.service "$UI_SERVICE"

# Reload systemd and restart service
echo "🔄 Restarting services..."
sudo systemctl daemon-reload
sudo systemctl enable ui
sudo systemctl restart ui

# Check service status
if ! systemctl is-active --quiet ui; then
  echo "❌ UI service failed to start!"
  sudo systemctl status ui
  exit 1
fi

echo "✅ Chatbot Ollama deployed and running on http://<your-ip>:3000"

