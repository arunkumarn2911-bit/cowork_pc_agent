# GitHub Copilot System Instructions: Cowork PC Agent & Self-Healing Framework

## Project Overview
Cowork PC Agent is an autonomous, bounded computer-use agent framework built with a Node.js (TypeScript) + React 19 frontend and an embedded Python central DAG workflow orchestrator. It features dynamic model routing (local Ollama LLMs such as Llama 3.2 / Qwen 2.5 alongside cloud Google Gemini API), Chrome DevTools Protocol (CDP port 9222) browser automation, and a Reflexion Self-Healing Agent with human-in-the-loop (HITL) approval and automated regression test rollback.

---

## Workspace Structure & Key Files

```text
├── .github/
│   └── copilot-instructions.md       # Copilot repo-level instructions (this file)
├── app/                              # Python core orchestrator & sub-agents
│   ├── action_schema.py             # Action definitions & strict bounds (max 5 steps/stage)
│   ├── executor.py                  # Sandboxed execution engine with safety guardrails
│   ├── export_zip.py                # Standalone code packager
│   ├── model_router.py              # Dynamic multi-model router (Ollama + Gemini)
│   ├── planner.py                   # DAG stage decomposition & goal triage
│   ├── workflow_engine.py           # State machine, pause/cancel, artifact manager
│   └── services/                    # Autonomous provider directory demo service
├── src/                              # React 19 + Tailwind CSS frontend
│   ├── App.tsx                      # Main workspace interface & modals controller
│   ├── components/
│   │   ├── ArchitectureExplainerModal.tsx # Hub-and-Spoke DAG visualizer
│   │   ├── CdpExplainerModal.tsx          # Chrome CDP setup guide
│   │   ├── ErrorRemediationCard.tsx       # Circuit-breaker card with Healer launch button
│   │   ├── ExecutionGraphModal.tsx        # Stage dependency visualizer
│   │   ├── ModelMatrixModal.tsx           # Multi-model per-phase selector & Ollama manager
│   │   ├── RecentWorkflowsDrawer.tsx      # Execution history drawer
│   │   ├── SelfHealingModal.tsx           # Reflexion healer workbench, diffs & rollback
│   │   ├── SubAgentRegistryModal.tsx      # Sub-agent capabilities inspector
│   │   └── UnitTestDrawer.tsx             # Python unit test runner UI
│   └── main.tsx                     # React root
├── tests/                            # 32 regression unit tests (100% test coverage)
│   ├── test_action_schema.py
│   ├── test_api.py
│   ├── test_end_to_end.py
│   ├── test_executor.py
│   ├── test_model_router.py
│   ├── test_planner.py
│   └── test_workflow_engine.py
├── gemini_config.json                # API key & endpoints file (hot-watched by server)
├── gemini_config.example.json        # Template for gemini_config.json
├── server.ts                         # Express server (port 3000), API proxies & Healer engine
├── package.json                      # Node dependencies & run scripts
├── requirements.txt                  # Python dependencies (FastAPI, httpx, uvicorn)
├── deploy-local.sh                   # One-command automated deployment script
└── LOCAL_DEPLOYMENT_GUIDE.md         # Comprehensive local runbook
```

---

## Deployment & Execution Commands

### 1. Environment Setup
```bash
# Install Node dependencies
npm install

# Setup Python environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Running Regression Tests
```bash
npm run test:py
# or directly:
python3 -m unittest discover -s tests -v
```
*Note: All 32 unit tests must pass before deploying or applying self-healing patches.*

### 3. Launching the Framework
```bash
# Start development server (serves frontend + backend on port 3000)
npm run dev
# or for production:
npm run build && npm run start
```
Access the application at `http://localhost:3000`.

### 4. Running with Local Model (Llama / Qwen via Ollama)
```bash
# Start Ollama daemon (default: http://127.0.0.1:11434)
ollama serve

# Pull lightweight recommended models
ollama pull llama3.2:3b
ollama pull qwen2.5:3b
```
*Tip: The framework also contains built-in process management. Clicking "Turn On Local Model" in the UI automatically spawns and monitors the daemon.*

### 5. Connecting Google Gemini API
- Edit `gemini_config.json` in the root:
  ```json
  {
    "gemini_api_key": "YOUR_ACTUAL_KEY",
    "ollama_base_url": "http://127.0.0.1:11434",
    "auto_start_local_model": true
  }
  ```
- The server hot-reloads changes to `gemini_config.json` automatically without requiring a restart.

---

## Core Framework Principles for Copilot

1. **Port Constraints**: The dev server runs on port `3000`. Do not change the default port unless passed through `PORT` environment variable.
2. **Circuit Breakers & HITL**: Consequential actions (such as shell command execution or framework self-modification) strictly require human approval. Do not bypass approval gates.
3. **Self-Healing Safeguards**:
   - Every code patch proposed by the Healer must be visually reviewed via diff.
   - Every patch requires a pre-mutation backup created in `.healing_backups/`.
   - Post-patch verification runs `runRegressionSuiteAsync()`. If any of the 32 tests fail, the Healer must trigger an immediate rollback to the backup.
4. **Safety Boundaries**: Workspace file operations must stay confined to `./workspace/` (path traversal protections enforce this).
