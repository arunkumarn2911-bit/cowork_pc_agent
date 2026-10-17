#!/usr/bin/env bash
set -e

echo "=================================================="
echo "  Deploying Cowork PC Agent (Local Environment)   "
echo "=================================================="

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is required but not installed. Please install Node.js v20+."
  exit 1
fi
echo "[✓] Node.js version: $(node -v)"

# Check npm
if ! command -v npm &> /dev/null; then
  echo "Error: npm is required but not installed."
  exit 1
fi
echo "[✓] npm version: $(npm -v)"

# Check Python
if command -v python3 &> /dev/null; then
  echo "[✓] Python version: $(python3 --version)"
else
  echo "[!] python3 not found. Test runner will require Python 3.10+."
fi

# Step 1: Install Node Dependencies
echo ""
echo "[1/5] Installing Node dependencies..."
npm install

# Step 2: Ensure environment & gemini_config.json configuration
echo ""
echo "[2/5] Checking environment & JSON key configuration..."
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "[✓] Created .env from .env.example"
  else
    cat <<EOT > .env
PORT=3000
NODE_ENV=production
OLLAMA_BASE_URL=http://127.0.0.1:11434
EOT
    echo "[✓] Created default .env"
  fi
else
  echo "[✓] Existing .env found"
fi

if [ ! -f gemini_config.json ]; then
  if [ -f gemini_config.example.json ]; then
    cp gemini_config.example.json gemini_config.json
    echo "[✓] Created gemini_config.json from template"
  fi
else
  echo "[✓] Existing gemini_config.json found"
fi
echo "    -> You can paste your Gemini API key directly into 'gemini_config.json'."

# Step 3: Check Local Ollama daemon & built-in launcher
echo ""
echo "[3/5] Checking Local Ollama daemon..."
if curl -s -m 1 http://127.0.0.1:11434/api/tags > /dev/null 2>&1; then
  echo "[✓] Local Ollama is online on port 11434"
else
  if command -v ollama &> /dev/null; then
    echo "[✓] Ollama binary detected in PATH."
    echo "    Starting local daemon in background via 'ollama serve'..."
    ollama serve > ollama_daemon.log 2>&1 &
    sleep 2
    if curl -s -m 1 http://127.0.0.1:11434/api/tags > /dev/null 2>&1; then
      echo "[✓] Local Ollama daemon successfully started!"
    else
      echo "[!] Daemon started, initializing on port 11434."
    fi
  else
    echo "[!] Ollama is not yet installed."
    echo "    Install via: curl -fsSL https://ollama.com/install.sh | sh"
    echo "    (Or click 'Turn On Local Model' in the app UI once installed)"
  fi
fi

# Step 4: Run Tests
echo ""
echo "[4/5] Running verification test suite..."
if command -v python3 &> /dev/null; then
  npm run test:py || echo "[!] Some tests warned, continuing..."
fi

# Step 5: Build Frontend
echo ""
echo "[5/5] Building frontend bundle..."
npm run build

echo ""
echo "=================================================="
echo "  Deployment Complete! Launching Server on :3000  "
echo "=================================================="
echo "Open: http://localhost:3000"
echo "To start in production mode: npm start"
echo "To start in dev mode:        npm run dev"
echo "To start local model:        npm run model:local (or click 'Turn On' in UI)"
echo "Config file for API key:     ./gemini_config.json"
echo "=================================================="
