# Implementation Plan: Autonomous PC Control Agent & Dynamic Routing Engine

Build an interactive, autonomous PC-controlling agent framework powered by a dynamic **7-Stage Intent & Routing Lifecycle**, backed by a modular **Python Execution Engine**, a **Per-Phase Multi-Model Matrix** (Local Ollama vs. Google Gemini API), and a real-time **React/TypeScript Chat & Telemetry Interface**.

---

### User Review Required

> [!IMPORTANT]
> **Key Framework Capabilities Added:**
> 1. **Per-Phase Model Selection Matrix**: You can assign specific models to different stages of execution:
>    - **Phase 1: Clarification & Intent Triage**: Quick/responsive model (e.g., Local `qwen2.5:3b`, `llama3.2:3b`, or Gemini Flash).
>    - **Phase 2: Plan Generation (DAG / Action Plan)**: High-reasoning model (e.g., Local `qwen2.5:7b`, `llama3.1:8b`, or Gemini Pro/Flash).
>    - **Phase 3: Verification & DOM Inspection**: Deterministic code functions with optional model verification.
>    - **Phase 4: Error Diagnosis & Remediation**: Deep diagnosis model to analyze stack traces & DOM snapshots.
> 2. **Dual Provider Support (Local Ollama & Gemini API)**:
>    - **Local Ollama** (`http://localhost:11434`): Auto-detects installed models via `GET /api/tags`, with strict JSON schema enforcement to ensure 3B/4B models output valid plans.
>    - **Gemini API**: High-speed, high-token-window reasoning via `@google/genai`.
> 3. **Execution Control**: Safe diagnostic actions auto-run; consequential steps (submitting prompts to AI Studio, executing shell commands) require 1-click in-chat approval.
> 4. **Observability**: Disconnected Chrome sessions (missing `--remote-debugging-port=9222`), login warnings, and page errors display live in-chat diagnostic cards with 1-click resolution actions.

---

### Architecture & Component Split

```
+-----------------------------------------------------------------------------------+
|                            React Frontend (Chat & UI)                             |
|  - 7-Stage Interactive Chat Feed        - Inline Clarification Cards (Ambiguity)  |
|  - Per-Phase Model Matrix Drawer        - Live Ollama & Chrome CDP Status Badges  |
|  - Consequential Action Approval Gates  - In-Chat Error & Remediation Cards       |
+-----------------------------------------------------------------------------------+
                                       |
                                REST & SSE APIs
                                       |
+-----------------------------------------------------------------------------------+
|                        Node/Express Backend (`server.ts`)                         |
|  - Orchestrates execution requests      - Proxies Ollama & Chrome CDP WebSocket   |
|  - Streams Python logs & events to UI   - Manages per-phase model configurations  |
+-----------------------------------------------------------------------------------+
                                       |
                                Python Subprocess
                                       |
+-----------------------------------------------------------------------------------+
|                           Python Execution Engine (`app/`)                        |
|  - `model_router.py`: Dispatches phase prompts to either Local Ollama or Gemini   |
|  - `workflow_engine.py`: 7-Stage dynamic lifecycle & state transitions            |
|  - `intent_router.py`: Intent decomposition, boundary checks & ambiguity triage   |
|  - `chrome_cdp.py`: Playwright CDP connection to Chrome on port 9222              |
|  - `subagents/aistudio_agent.py`: Gemini AI Studio DOM injector & verification   |
|  - `subagents/system_agent.py`: Safe/Consequential OS command executor            |
+-----------------------------------------------------------------------------------+
```

---

### Proposed Changes

#### 1. Multi-Model Matrix & Provider Engine (`app/` & `server.ts`)

- **`app/providers/base_provider.py`**:
  - Defines standard interface: `generate_response(prompt, system_prompt, schema=None, stream=False)`.
- **`app/providers/ollama_provider.py`**:
  - Connects to local Ollama instance (`http://localhost:11434/api/generate` and `/api/tags`).
  - Supports model auto-detection and enforces `format: "json"` with schema constraints for small (3B/4B) models.
- **`app/providers/gemini_provider.py`**:
  - Connects to Gemini API via `@google/genai` (supporting `gemini-2.5-flash`, `gemini-2.5-pro`).
- **`app/model_router.py`**:
  - Holds the active **Phase-to-Model Configuration Map**:
    ```json
    {
      "clarification": { "provider": "ollama", "model": "qwen2.5:3b" },
      "planning": { "provider": "gemini", "model": "gemini-2.5-flash" },
      "verification": { "provider": "ollama", "model": "qwen2.5:7b" },
      "remediation": { "provider": "gemini", "model": "gemini-2.5-flash" }
    }
    ```
  - Routes each phase dynamically to the selected engine.

#### 2. Workflow & Sub-Agent Execution Engine

- **`app/workflow_engine.py`**:
  - 7-Stage State Machine:
    1. *Request Analysis & Intent Triage* (uses `model_router.get_model("clarification")`)
    2. *Feasibility & Dependency Pre-Flight* (deterministic Python check: Chrome port 9222, Ollama health)
    3. *Interactive Clarification* (if phrasing is ambiguous or choices needed)
    4. *Plan Generation (DAG)* (uses `model_router.get_model("planning")`)
    5. *Approval Gate* (Safe actions auto-advance; consequential actions pause for user approval)
    6. *Execution & DOM Verification* (Playwright CDP connects to port 9222, controls AI Studio DOM)
    7. *Continuity Prompt* ("What is our next step?")
- **`app/subagents/aistudio_agent.py` & `app/tools/chrome_cdp.py`**:
  - Playwright CDP bridge attaching to running Chrome on `--remote-debugging-port=9222`.
  - Injects prompts into Google AI Studio, monitors token output, and verifies DOM build indicators.

#### 3. Backend API Routes (`server.ts`)

- `/api/models/config`: GET/POST active per-phase model configurations.
- `/api/models/ollama/tags`: Discovers installed Ollama models from `http://localhost:11434/api/tags`.
- `/api/models/ollama/ping`: Verifies if local Ollama daemon is active and responsive.
- `/api/browser/status`: Probes Chrome CDP port 9222.
- `/api/agent/stream`: Server-Sent Events (SSE) streaming real-time stage updates, execution logs, and DOM snapshots.
- `/api/agent/approve`: Receives user approval for consequential actions.
- `/api/agent/clarify`: Receives user selection from inline clarification cards.

#### 4. Frontend User Interface (`src/`)

- **`src/components/ModelMatrixModal.tsx`**:
  - Interactive configuration panel:
    - Phase 1 (Clarification): Dropdown to pick between Local Ollama models or Gemini.
    - Phase 2 (Planning): Dropdown to pick model for Plan Generation.
    - Phase 3 (Verification): Dropdown to pick verification model.
    - Phase 4 (Error Remediation): Dropdown to pick troubleshooting model.
  - **Live Diagnostics Bar**:
    - Ollama status badge (`🟢 Ollama Online (v0.5.x)` or `🔴 Ollama Offline`) with detected model count.
    - Gemini API status badge (`🟢 Ready`).
    - Quick "Test Connection" button.
- **`src/components/ChatInterface.tsx`**:
  - Live 7-stage conversation stream.
  - Interactive clarification cards with clickable options.
  - Consequential action approval cards with parameter inspect drawer.
  - Real-time Chrome/Ollama error alerts with copyable CLI remediation commands.
- **`src/components/StatusBar.tsx`**:
  - Top header displaying live Chrome CDP connectivity, Ollama health, and active model preset.

---

### Verification Plan

#### Automated Verification
- Verify Python engine runs without import errors: `python3 -m unittest` or test script.
- Build and verify React/Node application: `npm run build` and `compile_applet`.

#### Manual & Functional Testing
1. **Model Selection Verification**:
   - Open Model Matrix: Verify Ollama models are queried and listed alongside Gemini models.
   - Switch Phase 1 to Local Ollama and Phase 2 to Gemini: Send a prompt and verify logs show the exact models invoked per phase.
2. **Offline Ollama Fallback / Alert**:
   - Test when Ollama service is not running: Ensure UI gracefully warns user and allows 1-click fallback to Gemini API or shows command `ollama serve`.
3. **Chrome Session Detection & Action Gating**:
   - Test when Chrome on port 9222 is closed vs open: Verify in-chat diagnostic card appears.
   - Test approval gate: Verify prompt injection pauses and only proceeds after user clicks `[Approve]`.
4. **Interactive Clarification & Continuity**:
   - Submit ambiguous instruction: Verify clickable choice card renders in chat.
   - Once task finishes: Verify agent outputs verified outcome and asks *"What is the next step?"*
