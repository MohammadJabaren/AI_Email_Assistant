#!/bin/bash
set -e
PROJECT_DIR="$1"
NODE_BIN="/usr/bin/npm" # Adjust if needed
UI_SERVICE="/etc/systemd/system"

echo "➡️ Starting Chatbot Ollama deployment..."
#test

if ! command -v npm &> /dev/null; then
  echo "📦 Node.js/npm not found. Please install Node.js manually before running this script."
  # Install prerequisites
  sudo apt update
  sudo apt install -y curl
  # Download and run NodeSource install script (e.g., for Node.js 20)
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi

# 2. Navigate to the project
cd "$PROJECT_DIR"

# 3. Install NPM dependencies
echo "📥 Installing frontend dependencies with npm ci..."
$NODE_BIN ci

# 4. Copy and configure systemd services
echo "⚙️ Setting up systemd services..."


# UI service (runs `npm run dev`)
sudo cp ui.service "$UI_SERVICE"
sudo systemctl enable ui
sudo systemctl restart ui


if ! systemctl is-active --quiet ui; then
  echo "❌ UI service failed to start!"
  sudo systemctl status ui
  exit 1
fi

echo "✅ Chatbot Ollama deployed and running on http://<your-ip>:3000"

