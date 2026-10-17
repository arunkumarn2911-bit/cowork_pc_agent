# Cowork PC Agent: Autonomous Computer-Use Engine

A bounded, Cowork-style autonomous computer-use agent for Windows and local environments. It accepts natural-language goals, decomposes them into bounded stages (≤ 5 actions), observes real-time browser/desktop states, validates safety policies, and verifies observable evidence before completing tasks.

---

## 🚀 Quick Start (Local Windows Setup)

### 1. Prerequisites
- **Python 3.10+**: [python.org](https://www.python.org/) (ensure "Add Python to PATH" is checked during installation)
- **Node.js 18+**: [nodejs.org](https://nodejs.org/) (for the interactive React dashboard)
- **(Optional) Ollama**: [ollama.ai](https://ollama.ai/) for offline local model reasoning (`ollama run llama3`)

### 2. Install Python Dependencies
Open **Command Prompt (CMD)** in the project directory:
```cmd
pip install -r requirements.txt
playwright install chromium
```

### 3. (Optional) Configure Model Keys
For cloud planning via Gemini:
```cmd
set GEMINI_API_KEY="your-gemini-api-key"
```
Or for local models, ensure Ollama is running (`http://localhost:11434`). If neither is configured, the agent automatically uses its deterministic heuristic planner.

---

## 🧪 Testing & Execution

### Run the 26-Test Automated Suite
```cmd
python -m unittest discover -s tests -v
```
All 26 tests cover action validation, stage decomposition, consequential action safety blocks, artifact sandboxing, and end-to-end multi-stage execution.

### Run via Command Line Interface (CLI)
Execute any goal directly in your terminal:
```cmd
python -m app.cli "Open website https://medical-registry.internal/providers, search for Dr. Sarah Jenkins, extract fields, and save screenshot"
```
Flags:
- `--model auto|gemini|ollama|heuristic`: Select planner model provider
- `--max-stages 20`: Maximum allowed stages (default: 20)
- `--max-actions 100`: Action budget limit (default: 100)
- `--headless`: Run browser headlessly or headed (`--no-headless`)

### Start the FastAPI Agent Backend
```cmd
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Swagger API docs available at `http://127.0.0.1:8000/docs`.

### Start the Web Dashboard
```cmd
npm install
npm run dev
```
Open `http://localhost:3000` to access the interactive dashboard with:
- Live stage timeline with duration timers
- Virtual browser and DOM inspector
- Workspace artifact viewer
- Human-in-the-loop consequential action approval gates
- Recent session history drawer

---

## 🛡️ Safety & Consequential Action Guard

Actions are categorized into:
- **`SAFE`**: Navigation, inspection, searching, extracting, screenshots, and sandbox file writes (`./workspace`).
- **`CONSEQUENTIAL`**: Form submissions with payment/external effects, deletions, sending messages, financial trading.

When a consequential action is reached:
1. The engine pauses execution.
2. Workflow state transitions to `AWAITING_APPROVAL`.
3. The exact target and parameters are presented for human authorization.
4. The action executes only after explicit approval.

---

## 📁 Project Structure

```
├── app/
│   ├── agent/
│   │   ├── action_schema.py    # Action validation, risk levels (SAFE / CONSEQUENTIAL)
│   │   ├── planner.py          # Bounded stage planner (≤ 5 steps)
│   │   ├── executor.py         # Action dispatcher & safety gatekeeper
│   │   ├── task_store.py       # SQLite persistent workflow storage
│   │   └── workflow_engine.py  # Observe -> Plan -> Validate -> Execute -> Verify loop
│   ├── tools/
│   │   ├── browser_control.py  # Playwright browser controller
│   │   ├── desktop_control.py  # PyAutoGUI desktop automation (with failsafe)
│   │   └── artifact_manager.py # Sandboxed workspace manager with path traversal guard
│   ├── services/
│   │   ├── gemini_client.py    # Google Gemini API client
│   │   ├── ollama_client.py    # Local Ollama LLM client
│   │   └── voice_client.py     # Voice STT/TTS hooks
│   ├── main.py                 # FastAPI REST API server
│   ├── cli.py                  # Terminal CLI runner
│   └── export_zip.py           # Codebase ZIP packaging utility
├── tests/                      # 26 unit & end-to-end tests
├── src/                        # React / Vite interactive web dashboard
├── server.ts                   # Express server with Vite middlewares
├── requirements.txt            # Python dependencies
└── package.json                # Web dashboard dependencies
```
