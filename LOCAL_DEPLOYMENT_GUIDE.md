# Local Deployment Guide: Cowork PC Agent & Multi-Model Engine

> **INSTRUCTION FOR GITHUB COPILOT / CURSOR / TERMINAL AGENT:**
> This is a self-contained, read-only deployment specification. You can execute these commands step-by-step or run `./deploy-local.sh` to bring up the full Cowork PC Agent system locally.

---

## 1. System Requirements & Architecture

The Cowork PC Agent is a full-stack, autonomous computer-use system with a dynamic per-phase model matrix (Local Ollama LLM + Google Gemini API) and Chrome DevTools Protocol (CDP) browser automation.

| Component | Role | Default Port / Target |
| :--- | :--- | :--- |
| **Node.js Fullstack Server** | Express API + Vite React 19 UI bundle | Port `3000` |
| **Python Workflow Engine** | Central DAG Orchestrator & Sandboxed Executor | Embedded via `server.ts` & Python runtime |
| **Local LLM Daemon (Ollama)** | Offline Phase Execution (`qwen2.5:3b`, `qwen2.5:7b`) | Port `11434` (`http://127.0.0.1:11434`) |
| **Google Gemini API** | Cloud Multi-Model Fallback & High-Reasoning DAGs | `https://generativelanguage.googleapis.com` |
| **API Key Config JSON** | Dedicated config file for Gemini credentials | `./gemini_config.json` |
| **Chrome DevTools Protocol (CDP)** | Headless / Remote Browser Sub-Agent | Port `9222` (`http://127.0.0.1:9222`) |

### Prerequisites
* **Node.js**: v20.x or v22.x LTS (`node -v`)
* **npm**: v10+ (`npm -v`)
* **Python**: 3.10, 3.11, or 3.12 with `pip`
* **Ollama** (for local models): Install from [ollama.com](https://ollama.com) or run `curl -fsSL https://ollama.com/install.sh | sh`
* **Google Chrome** (optional, for live browser automation): Standard Chrome or Chromium

---

## 2. One-Command Quick Start

If you want automated deployment in one command, execute:

```bash
chmod +x ./deploy-local.sh
./deploy-local.sh
```

---

## 3. Step-by-Step Manual Deployment

### Step 1: Install Node.js Dependencies
From the repository root:
```bash
npm install
```

### Step 2: Install Python Dependencies
```bash
# If using a virtual environment (recommended):
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install requirements
pip install -r requirements.txt
```

### Step 3: Configure Gemini API Key via JSON File (`gemini_config.json`)
The application includes built-in support for reading credentials directly from `gemini_config.json`:
1. Open or create `gemini_config.json` in the workspace root (or copy from `gemini_config.example.json`):
```json
{
  "gemini_api_key": "YOUR_GEMINI_API_KEY_HERE",
  "ollama_base_url": "http://127.0.0.1:11434",
  "auto_start_local_model": true,
  "notes": "Paste your Google Gemini API key into 'gemini_api_key'. The application watches this file and connects to Gemini automatically."
}
```
2. Paste your Gemini API key into `"gemini_api_key"`.
3. **No restart required**: The server hot-watches `gemini_config.json` and connects immediately upon saving!
4. *(Alternative)*: You can also set `GEMINI_API_KEY=your_key` in `.env`, or paste it into the UI Model Matrix modal.

### Step 4: Turning On Local Model (Built-in Code or CLI)
You have three easy ways to turn on the local model:

#### Option A: One-Click in the UI (Built-in Code)
1. Open the UI at `http://localhost:3000`.
2. Click the **"Ollama: Offline (Turn On)"** pill in the top navigation bar.
3. Click the green **"Turn On Local Model"** button. The server spawns and manages `ollama serve` in the background automatically!

#### Option B: npm Script
```bash
npm run model:local
```

#### Option C: Native Ollama Command
```bash
# Start daemon:
ollama serve &

# Pull recommended lightweight model:
ollama pull qwen2.5:3b
```

### Step 5: (Optional) Start Chrome in Remote Debugging Mode (CDP)
To allow the Browser Sub-Agent to control a live Chrome instance:
```bash
# On Linux / WSL:
google-chrome --remote-debugging-port=9222 --headless=new &

# On macOS:
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --headless=new &

# On Windows:
# start chrome.exe --remote-debugging-port=9222 --headless=new
```
*(Note: If Chrome is not running on port 9222, the system automatically runs in Simulated Mode with safe DOM parsing.)*

### Step 6: Verify Test Suite
Run the 32 automated Python tests to verify sandboxing, action validation, and circuit breakers:
```bash
npm run test:py
```
Expected output:
```text
Ran 32 tests in 1.8s
OK
```

### Step 7: Build & Launch Production Server
```bash
# Build the React frontend
npm run build

# Start the fullstack server
npm start
```
The server will bind to `http://0.0.0.0:3000` (accessible at `http://localhost:3000`).

---

---

## 4. Verification & Health Probes

Run these curl commands to verify your deployment is fully operational:

### 1. General Health Probe
```bash
curl -s http://localhost:3000/api/health
```

### 2. Verify Self-Healing Health & Regression Suite
```bash
curl -s http://localhost:3000/api/healer/health
```

### 3. Verify JSON Config Loader
```bash
curl -s http://localhost:3000/api/config/gemini-json
```

### 4. Verify Local Daemon Status
```bash
curl -s http://localhost:3000/api/models/ollama/daemon-status
```

### 5. Live Model Discovery Probe (Gemini + Local)
```bash
curl -s http://localhost:3000/api/models/discover
```
* **Gemini API**: Lists only verified live models fetched from Google.
* **Local Ollama**: Lists only models that are actively installed in the local daemon.

---

## 5. GitHub Copilot & Cursor Instructions

If you are using **GitHub Copilot**, **Copilot Workspace**, or **Cursor**:
1. Open this repository in VS Code or your editor of choice.
2. The file `.github/copilot-instructions.md` will be ingested automatically by Copilot to understand the DAG architecture, sub-agents, test suite, and circuit breakers.
3. You can prompt Copilot with:
   - *"Deploy this framework locally using deploy-local.sh and run the 32 regression tests."*
   - *"Diagnose why Chrome CDP port 9222 is unreachable and recommend a fallback."*
   - *"Generate a new sub-agent for PostgreSQL inspection and register it in server.ts and SUB_AGENTS."*
4. All code modifications should be validated against `npm run test:py` and `npm run lint` before committing.

---

## 6. Downloading & Exporting the Entire Framework ZIP

You can download the full codebase as a clean `.zip` archive at any time:
- **Via Web UI**: Click the **"Export ZIP"** button in the top navigation bar.
- **Via cURL / Browser**: Navigate to `http://localhost:3000/api/export/zip` (or run `curl -O http://localhost:3000/api/export/zip`).
- **Via CLI Generator**:
  ```bash
  python3 app/export_zip.py cowork_pc_agent.zip
  ```

---

## 7. Security Note
`gemini_config.json` is automatically included in `.gitignore` to prevent committing your private API keys to source control. Use `gemini_config.example.json` as the shared template.

