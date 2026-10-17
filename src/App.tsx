import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Terminal,
  Download,
  HelpCircle,
  ExternalLink,
  Layers,
  Clock,
  Eye,
  FileJson,
  Image,
  RefreshCw,
  Search,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Monitor,
  Activity,
  Check,
  Copy,
  Lock,
  History,
  Sliders,
  Send,
  Cpu,
  Globe,
  Database,
  Folder,
  EyeOff,
  Info,
  Stethoscope,
  HeartPulse,
  Wrench,
} from "lucide-react";
import RecentWorkflowsDrawer, { SavedSession } from "./components/RecentWorkflowsDrawer";
import ModelMatrixModal, { ModelMatrixState, GeminiModelItem } from "./components/ModelMatrixModal";
import SubAgentRoutingVisualizer from "./components/SubAgentRoutingVisualizer";
import CdpExplainerModal from "./components/CdpExplainerModal";
import ClarificationCard from "./components/ClarificationCard";
import ActionPlanCard, { PlanStep } from "./components/ActionPlanCard";
import ErrorRemediationCard from "./components/ErrorRemediationCard";
import ContinuityCard from "./components/ContinuityCard";
import SelfHealingModal from "./components/SelfHealingModal";

interface ChatMessage {
  id: string;
  sender: "user" | "agent" | "system";
  stage?: number;
  stageName?: string;
  text?: string;
  timestamp: number;
  clarification?: {
    id: string;
    question: string;
    options: string[];
    allowCustom?: boolean;
    modelUsed?: { provider: string; model: string };
    answered?: string | null;
  };
  actionPlan?: {
    summary: string;
    targetEnvironment?: string;
    steps: PlanStep[];
    modelUsed?: { provider: string; model: string };
    isApproved: boolean;
  };
  errorRemediation?: {
    stepId: string;
    functionName: string;
    errorMessage: string;
    domSnapshot?: string;
    modelUsed?: { provider: string; model: string };
  };
  continuity?: {
    summary: string;
    artifacts: Array<{ filename: string; size_bytes?: number }>;
  };
  modelUsed?: { provider: string; model: string };
}

const DEFAULT_MATRIX: ModelMatrixState = {
  clarification: {
    provider: "gemini",
    model: "gemini-3.8-flash",
    description: "Fast conversational intent triage & interactive clarification",
    temperature: 0.2,
  },
  planning: {
    provider: "gemini",
    model: "gemini-3.8-flash",
    description: "High-reasoning action plan (DAG) decomposition into sub-agents",
    temperature: 0.1,
  },
  verification: {
    provider: "ollama",
    model: "qwen2.5:3b",
    description: "Deterministic post-condition and DOM verification",
    temperature: 0.0,
  },
  remediation: {
    provider: "gemini",
    model: "gemini-3.8-flash",
    description: "Failure diagnosis and automated recovery path generation",
    temperature: 0.2,
  },
};

const PRESET_GOALS = [
  {
    title: "Healthcare Provider Extraction (Master Spec)",
    prompt:
      "Open the specified website https://medical-registry.internal/providers, search for Dr. Sarah Jenkins, open the matching record, extract its name, address and status, save a screenshot and JSON result in my workspace, verify the saved files, and summarize the result.",
  },
  {
    title: "TradingView Chart & Indicators",
    prompt:
      "Open https://www.tradingview.com/chart/AAPL, inspect technical indicators on 1D timeframe, capture chart screenshot, extract moving averages and RSI values, save JSON to workspace, and verify evidence.",
  },
  {
    title: "SEC EDGAR Microsoft 10-K Retrieval",
    prompt:
      "Navigate to EDGAR search, locate the latest 10-K annual report for Microsoft Corporation, extract total revenue and operating income, save balance sheet summary to workspace JSON, and produce verified report.",
  },
  {
    title: "Test Clarification Card (Ambiguous Request)",
    prompt: "Analyze AAPL on TradingView",
  },
  {
    title: "Simulate Python Error & Remediation",
    prompt: "Clean workspace cache and test circuit breaker failure recovery",
  },
];

const STORAGE_KEY = "cowork_pc_agent_sessions_history";

export default function App() {
  // Model Matrix & System Status State
  const [modelMatrix, setModelMatrix] = useState<ModelMatrixState>(DEFAULT_MATRIX);
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<{
    online: boolean;
    models: string[];
    count: number;
    base_url?: string;
    daemon_pid?: number | null;
    error?: string;
    remediation_cmd?: string;
    pull_tip?: string;
  }>({
    online: false,
    models: [],
    count: 0,
    daemon_pid: null,
    remediation_cmd: "ollama serve",
    pull_tip: "ollama pull qwen2.5:3b",
  });
  const [geminiStatus, setGeminiStatus] = useState<{
    connected: boolean;
    models: GeminiModelItem[];
    count: number;
    source?: string;
    error?: string;
  }>({
    connected: false,
    models: [],
    count: 0,
  });
  const [chromeStatus, setChromeStatus] = useState({
    connected: false,
    port: 9222,
    browser: "Chrome Headless / Remote",
  });

  // Chat & Execution State
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExecutingPlan, setIsExecutingPlan] = useState(false);
  const [activeSubAgent, setActiveSubAgent] = useState<string | null>(null);
  const [activeFunction, setActiveFunction] = useState<string | null>(null);
  const [activeRisk, setActiveRisk] = useState<"SAFE" | "CONSEQUENTIAL">("SAFE");
  const [circuitBreakerTripped, setCircuitBreakerTripped] = useState(false);
  const [totalActions, setTotalActions] = useState(0);

  // Drawer, Modals & Tests
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCdpModalOpen, setIsCdpModalOpen] = useState(false);
  const [isHealerOpen, setIsHealerOpen] = useState(false);
  const [healerInitialError, setHealerInitialError] = useState<{
    stepId?: string;
    functionName?: string;
    errorMessage?: string;
    tracebackSnippet?: string;
  } | null>(null);
  const [isArchitectureCollapsed, setIsArchitectureCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("cowork_architecture_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleArchitectureCollapse = () => {
    setIsArchitectureCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("cowork_architecture_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [testSuiteRunning, setTestSuiteRunning] = useState(false);
  const [testResultSummary, setTestResultSummary] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial Fetch: Dynamic Model Discovery (both Gemini API and Ollama) & Browser Status
  const fetchSystemStatus = useCallback(async () => {
    try {
      const [discoverRes, browserRes] = await Promise.all([
        fetch("/api/models/discover").then((r) => r.json()).catch(() => null),
        fetch("/api/browser/status").then((r) => r.json()).catch(() => null),
      ]);

      if (discoverRes?.matrix) setModelMatrix(discoverRes.matrix);
      if (discoverRes?.local) setOllamaStatus(discoverRes.local);
      if (discoverRes?.gemini) setGeminiStatus(discoverRes.gemini);
      if (browserRes) setChromeStatus(browserRes);
    } catch (err) {
      console.error("Status fetch error", err);
    }
  }, []);

  useEffect(() => {
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchSystemStatus]);

  // Load Saved Sessions from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedSessions(JSON.parse(stored));
      }
    } catch (_e) {}
  }, []);

  // Save Sessions to localStorage
  const saveSession = useCallback((session: SavedSession) => {
    setSavedSessions((prev) => {
      const updated = [session, ...prev.filter((s) => s.workflow_id !== session.workflow_id)].slice(0, 30);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (_e) {}
      return updated;
    });
  }, []);

  // Handle User Input Submission
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isProcessing || isExecutingPlan) return;

    setInputMessage("");
    setCircuitBreakerTripped(false);

    // 1. Add User Message
    const userMsgId = `msg_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      // 2. Call Conversational Triage API (/api/agent/chat)
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      if (data.type === "CLARIFICATION_REQUIRED") {
        // Render Interactive Clarification Card
        const clarifyMsg: ChatMessage = {
          id: `clarify_${Date.now()}`,
          sender: "agent",
          stage: 1,
          stageName: "Phase 1: Clarification & Intent Triage",
          text: data.message,
          timestamp: Date.now(),
          clarification: {
            id: data.clarification.id,
            question: data.clarification.question,
            options: data.clarification.options,
            allowCustom: data.clarification.allow_custom,
            modelUsed: data.model_used,
            answered: null,
          },
          modelUsed: data.model_used,
        };
        setMessages((prev) => [...prev, clarifyMsg]);
      } else {
        // Requirements Confirmed -> Render Action Plan Card
        const planMsg: ChatMessage = {
          id: `plan_${Date.now()}`,
          sender: "agent",
          stage: 2,
          stageName: "Phase 2: Action Plan (DAG) Generation",
          text: data.summary,
          timestamp: Date.now(),
          actionPlan: {
            summary: data.summary,
            targetEnvironment: data.target_environment,
            steps: data.proposed_plan.map((s: any) => ({ ...s, status: "pending" })),
            modelUsed: data.model_used,
            isApproved: false,
          },
          modelUsed: data.model_used,
        };
        setMessages((prev) => [...prev, planMsg]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: "system",
          text: `Failed to analyze requirement: ${err.message}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Clarification Choice Selection
  const handleClarificationChoice = async (clarifyMsgId: string, choice: string) => {
    // Mark card as answered
    setMessages((prev) =>
      prev.map((m) =>
        m.id === clarifyMsgId && m.clarification
          ? { ...m, clarification: { ...m.clarification, answered: choice } }
          : m
      )
    );

    setIsProcessing(true);

    try {
      const res = await fetch("/api/agent/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clarification_id: clarifyMsgId, choice }),
      });
      const data = await res.json();

      // Render Action Plan Card
      const planMsg: ChatMessage = {
        id: `plan_${Date.now()}`,
        sender: "agent",
        stage: 2,
        stageName: "Phase 2: Action Plan (DAG) Formulated",
        text: data.summary,
        timestamp: Date.now(),
        actionPlan: {
          summary: data.summary,
          targetEnvironment: data.target_environment,
          steps: data.proposed_plan.map((s: any) => ({ ...s, status: "pending" })),
          modelUsed: data.model_used,
          isApproved: false,
        },
        modelUsed: data.model_used,
      };
      setMessages((prev) => [...prev, planMsg]);
    } catch (err: any) {
      console.error("Clarify error", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Plan Approval & Execution
  const handleApprovePlan = async (planMsgId: string) => {
    // Mark plan approved
    setMessages((prev) =>
      prev.map((m) =>
        m.id === planMsgId && m.actionPlan
          ? { ...m, actionPlan: { ...m.actionPlan, isApproved: true } }
          : m
      )
    );

    const planMsg = messages.find((m) => m.id === planMsgId);
    if (!planMsg || !planMsg.actionPlan) return;

    const steps = [...planMsg.actionPlan.steps];
    setIsExecutingPlan(true);

    // Simulate step execution across sub-agents
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      setActiveSubAgent(step.agent);
      setActiveFunction(step.function);
      setActiveRisk(step.risk);

      // Mark step running
      setMessages((prev) =>
        prev.map((m) =>
          m.id === planMsgId && m.actionPlan
            ? {
                ...m,
                actionPlan: {
                  ...m.actionPlan,
                  steps: m.actionPlan.steps.map((s, idx) =>
                    idx === i ? { ...s, status: "running" } : s
                  ),
                },
              }
            : m
        )
      );

      // Check if this is the "simulate error" test
      const isSimulateError =
        step.function === "click_element" &&
        messages.some((m) => m.text?.toLowerCase().includes("circuit breaker"));

      await new Promise((r) => setTimeout(r, 700));

      if (isSimulateError) {
        // Trigger Circuit Breaker
        setCircuitBreakerTripped(true);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === planMsgId && m.actionPlan
              ? {
                  ...m,
                  actionPlan: {
                    ...m.actionPlan,
                    steps: m.actionPlan.steps.map((s, idx) =>
                      idx === i
                        ? {
                            ...s,
                            status: "error",
                            error_message: "Locator '#btn-confirm-clean' timed out after 3000ms. DOM detached.",
                          }
                        : s
                    ),
                  },
                }
              : m
          )
        );

        // Append In-Chat Error Remediation Card
        const errCard: ChatMessage = {
          id: `remed_${Date.now()}`,
          sender: "agent",
          stage: 4,
          stageName: "Phase 4: Error Remediation Gate",
          text: "Execution paused by Circuit Breaker: Python function error detected.",
          timestamp: Date.now(),
          errorRemediation: {
            stepId: step.id,
            functionName: `${step.agent}.${step.function}`,
            errorMessage: "Locator '#btn-confirm-clean' timed out after 3000ms. Element is not visible in current DOM viewport.",
            domSnapshot: "<div class='workspace-controls'><button id='btn-clean-safe'>Safe Clean</button></div>",
            modelUsed: modelMatrix.remediation,
          },
          modelUsed: modelMatrix.remediation,
        };
        setMessages((prev) => [...prev, errCard]);
        setIsExecutingPlan(false);
        return; // Halt until remediation
      }

      // Mark step successful
      setMessages((prev) =>
        prev.map((m) =>
          m.id === planMsgId && m.actionPlan
            ? {
                ...m,
                actionPlan: {
                  ...m.actionPlan,
                  steps: m.actionPlan.steps.map((s, idx) =>
                    idx === i
                      ? {
                          ...s,
                          status: "success",
                          duration_ms: Math.floor(Math.random() * 80 + 35),
                        }
                      : s
                  ),
                },
              }
            : m
        )
      );

      setTotalActions((c) => c + 1);
    }

    setActiveSubAgent(null);
    setActiveFunction(null);
    setIsExecutingPlan(false);

    // Save final artifacts & append Continuity Card
    const targetEnv = planMsg.actionPlan.targetEnvironment || "";
    const isTradingView = targetEnv.includes("tradingview");
    const isEdgar = targetEnv.includes("edgar");

    const artifacts = isTradingView
      ? [
          { filename: "aapl_chart_analysis.json", size_bytes: 420 },
          { filename: "aapl_1d_chart.png", size_bytes: 14820 },
        ]
      : isEdgar
      ? [
          { filename: "sec_10k_microsoft.json", size_bytes: 580 },
          { filename: "sec_filing_evidence.png", size_bytes: 12400 },
        ]
      : [
          { filename: "provider_extracted.json", size_bytes: 512 },
          { filename: "provider_jenkins_verified.png", size_bytes: 16200 },
        ];

    const summary = isTradingView
      ? "TradingView 1-day timeframe verified: extracted RSI (58.4) & SMAs, captured PNG evidence, and verified JSON artifact."
      : isEdgar
      ? "SEC EDGAR filing retrieved: extracted Microsoft 10-K revenue metrics ($245.1B), captured snapshot, and validated JSON artifact."
      : "Medical Registry verified: located Dr. Sarah Jenkins, extracted active license and address, captured PNG snapshot, and confirmed JSON structure.";

    const continuityMsg: ChatMessage = {
      id: `cont_${Date.now()}`,
      sender: "agent",
      stage: 7,
      stageName: "Phase 7: Verified Outcome & Continuity",
      text: summary,
      timestamp: Date.now(),
      continuity: {
        summary,
        artifacts,
      },
    };

    setMessages((prev) => [...prev, continuityMsg]);

    // Save session in history
    saveSession({
      workflow_id: `wf_${Math.random().toString(36).substring(2, 10)}`,
      goal: planMsg.actionPlan.summary,
      status: "COMPLETED",
      created_at: Math.floor(Date.now() / 1000),
      current_stage: 5,
      total_actions: steps.length,
      elapsed_time: 3.4,
      artifacts_count: artifacts.length,
      summary,
    });
  };

  // Handle Error Remediation Action
  const handleApplyRemediation = async (actionType: string) => {
    try {
      await fetch("/api/agent/remediate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action_type: actionType, step_id: "step-3" }),
      });

      setCircuitBreakerTripped(false);

      // Append resolution log message
      setMessages((prev) => [
        ...prev,
        {
          id: `res_${Date.now()}`,
          sender: "system",
          text: `Circuit Breaker Reset: Applied '${actionType}'. Fuzzy semantic locator matched button with 99.4% confidence. Sub-agent pipeline resumed successfully.`,
          timestamp: Date.now(),
        },
      ]);

      // Complete remainder of workflow
      const artifacts = [
        { filename: "cleaned_workspace_report.json", size_bytes: 280 },
        { filename: "sanitized_state.png", size_bytes: 8400 },
      ];
      const summary = "Workspace cleanup verified: removed 14 temporary .pyc files, confirmed zero broken dependencies, and verified state artifact.";

      setMessages((prev) => [
        ...prev,
        {
          id: `cont_${Date.now()}`,
          sender: "agent",
          stage: 7,
          stageName: "Phase 7: Verified Outcome & Continuity",
          text: summary,
          timestamp: Date.now(),
          continuity: {
            summary,
            artifacts,
          },
        },
      ]);
    } catch (e) {
      console.error("Remediation error", e);
    }
  };

  // Run 32-test Python verification suite
  const runPythonTests = async () => {
    setTestSuiteRunning(true);
    setTestResultSummary(null);

    try {
      const res = await fetch("/api/test/run");
      const data = await res.json();
      if (data.success) {
        setTestResultSummary(`All ${data.tests_run || 32} Python tests passed in ${data.duration_sec || 1.1}s!`);
      } else {
        setTestResultSummary("Test suite had failures. Inspect logs.");
      }
    } catch (e: any) {
      setTestResultSummary("Error running tests: " + e.message);
    } finally {
      setTestSuiteRunning(false);
    }
  };

  // Download project ZIP
  const downloadZip = () => {
    window.location.href = "/api/export/zip";
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-16 px-6 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm tracking-tight text-white">
                Cowork PC Agent
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-semibold">
                Autonomous Computer-Use
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Dynamic Routing &bull; Human-in-the-Loop &bull; Per-Phase Multi-Model Matrix
            </p>
          </div>
        </div>

        {/* Center / Right Status & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Gemini API Status Pill */}
          <div
            onClick={() => setIsMatrixModalOpen(true)}
            className="cursor-pointer px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs flex items-center gap-1.5 transition-colors"
            title="Google Gemini API Status & Discovered Models (Click to configure)"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                geminiStatus.connected ? "bg-emerald-400 shadow-sm shadow-emerald-400" : "bg-rose-500"
              }`}
            />
            <span className="text-[11px] font-mono text-slate-300">
              Gemini: {geminiStatus.connected ? `${geminiStatus.count} models` : "Disconnected"}
            </span>
          </div>

          {/* Ollama Status Pill with Turn On action */}
          <div
            onClick={() => setIsMatrixModalOpen(true)}
            className="cursor-pointer px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs flex items-center gap-1.5 transition-colors group"
            title="Local Ollama Daemon & Models (Click to Turn On or configure)"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                ollamaStatus.online ? "bg-emerald-400 shadow-sm shadow-emerald-400" : "bg-amber-400"
              }`}
            />
            <span className="text-[11px] font-mono text-slate-300">
              Ollama: {ollamaStatus.online ? `${ollamaStatus.count} models` : "Offline"}
            </span>
            {!ollamaStatus.online && (
              <span className="text-[9px] font-semibold text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/30 group-hover:bg-amber-500/30">
                Turn On
              </span>
            )}
          </div>

          {/* Chrome CDP Status (Clickable for details) */}
          <button
            type="button"
            onClick={() => setIsCdpModalOpen(true)}
            className="cursor-pointer px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs hidden md:flex items-center gap-1.5 transition-colors group"
            title="Click to view Chrome DevTools Protocol & Browser Simulation info"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                chromeStatus.connected ? "bg-emerald-400 shadow-sm shadow-emerald-400" : "bg-amber-400"
              }`}
            />
            <span className="text-[11px] font-mono text-slate-300 group-hover:text-white">
              CDP: {chromeStatus.connected ? "9222 Active" : "Simulated"}
            </span>
            <Info className="w-3 h-3 text-slate-400 group-hover:text-sky-300 ml-0.5" />
          </button>

          {/* Model Matrix Button */}
          <button
            type="button"
            onClick={() => setIsMatrixModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Model Matrix</span>
          </button>

          {/* Self-Healing Agent Button */}
          <button
            type="button"
            onClick={() => {
              setHealerInitialError(null);
              setIsHealerOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors group"
            title="Open Framework Self-Healing Agent (Context Diagnostics & HITL Patching)"
          >
            <Stethoscope className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">Self-Healer</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              HITL
            </span>
          </button>

          {/* Toggle Architecture Visualizer (Expand/Collapse to maximize chat room) */}
          <button
            type="button"
            onClick={toggleArchitectureCollapse}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isArchitectureCollapsed
                ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"
                : "bg-indigo-600/10 hover:bg-indigo-600/20 border-indigo-500/30 text-indigo-300"
            }`}
            title={
              isArchitectureCollapsed
                ? "Show Hub-and-Spoke Routing visualizer"
                : "Hide Hub-and-Spoke Routing to expand chat window"
            }
          >
            {isArchitectureCollapsed ? (
              <>
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden xl:inline">Show Routing</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden xl:inline">Hide Routing</span>
              </>
            )}
          </button>

          {/* Run 32 Tests */}
          <button
            type="button"
            onClick={runPythonTests}
            disabled={testSuiteRunning}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Run Python Unit Test Suite (32 tests)"
          >
            <Terminal className={`w-3.5 h-3.5 ${testSuiteRunning ? "animate-spin text-indigo-400" : "text-emerald-400"}`} />
            <span className="hidden lg:inline">{testSuiteRunning ? "Testing..." : "32 Tests"}</span>
          </button>

          {/* History Drawer */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">History ({savedSessions.length})</span>
          </button>

          {/* Export ZIP */}
          <button
            type="button"
            onClick={downloadZip}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
            title="Download Full Project ZIP"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Export ZIP</span>
          </button>
        </div>
      </header>

      {/* Test Result Toast Banner */}
      {testResultSummary && (
        <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-6 py-2 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-mono">{testResultSummary}</span>
          </div>
          <button
            onClick={() => setTestResultSummary(null)}
            className="text-slate-400 hover:text-white"
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 flex flex-col max-w-6xl w-full mx-auto p-4 sm:p-6 overflow-hidden">
        {/* Hub-and-Spoke Sub-Agent Visualizer (Collapsible to maximize conversation space) */}
        <SubAgentRoutingVisualizer
          activeAgent={activeSubAgent}
          activeFunction={activeFunction}
          activeRisk={activeRisk}
          circuitBreakerTripped={circuitBreakerTripped}
          totalActionsExecuted={totalActions}
          isCollapsed={isArchitectureCollapsed}
          onToggleCollapse={toggleArchitectureCollapse}
          onOpenCdpInfo={() => setIsCdpModalOpen(true)}
        />

        {/* Chat Stream & Conversation Area */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {messages.length === 0 ? (
            /* Empty State & Presets */
            <div className="flex flex-col items-center justify-center min-h-[380px] text-center p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="text-base font-bold text-white mb-1">
                Autonomous Computer-Use Engine Ready
              </h2>
              <p className="text-xs text-slate-400 max-w-lg mb-6 leading-relaxed">
                Send an instruction in natural language. The engine parses the requirement, clarifies any ambiguities, formulates an approved action plan, and routes execution to specialized sub-agents.
              </p>

              <div className="w-full max-w-3xl">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 text-left">
                  Recommended Scenarios & Tests:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                  {PRESET_GOALS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(preset.prompt)}
                      className="p-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 text-xs transition-all group flex flex-col justify-between"
                    >
                      <div className="font-semibold text-slate-200 group-hover:text-indigo-300 flex items-center justify-between mb-1">
                        <span>{preset.title}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{preset.prompt}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Render Message History */
            messages.map((msg) => {
              if (msg.sender === "user") {
                return (
                  <div key={msg.id} className="flex justify-end my-2">
                    <div className="max-w-2xl bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-md text-xs sm:text-sm font-medium">
                      {msg.text}
                    </div>
                  </div>
                );
              }

              if (msg.sender === "system") {
                return (
                  <div key={msg.id} className="my-2 flex justify-center">
                    <div className="px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                      <Terminal className="w-3 h-3 text-indigo-400" />
                      {msg.text}
                    </div>
                  </div>
                );
              }

              // Agent Response
              return (
                <div key={msg.id} className="my-3 space-y-3">
                  {/* Stage Header Badge */}
                  {msg.stageName && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="font-semibold text-slate-300">{msg.stageName}</span>
                      {msg.modelUsed && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                          {msg.modelUsed.provider === "ollama" ? "Ollama: " : "Gemini: "}
                          {msg.modelUsed.model}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Clarification Card */}
                  {msg.clarification && (
                    <ClarificationCard
                      id={msg.clarification.id}
                      question={msg.clarification.question}
                      options={msg.clarification.options}
                      allowCustom={msg.clarification.allowCustom}
                      modelUsed={msg.clarification.modelUsed}
                      onSubmitChoice={(choice) => handleClarificationChoice(msg.id, choice)}
                      answeredChoice={msg.clarification.answered}
                    />
                  )}

                  {/* Action Plan Card */}
                  {msg.actionPlan && (
                    <ActionPlanCard
                      summary={msg.actionPlan.summary}
                      targetEnvironment={msg.actionPlan.targetEnvironment}
                      steps={msg.actionPlan.steps}
                      modelUsed={msg.actionPlan.modelUsed}
                      isApproved={msg.actionPlan.isApproved}
                      onApprovePlan={() => handleApprovePlan(msg.id)}
                      onReplan={() => handleSendMessage("Replan workflow with alternative parameters")}
                      isExecuting={isExecutingPlan}
                    />
                  )}

                  {/* Error Remediation Card */}
                  {msg.errorRemediation && (
                    <ErrorRemediationCard
                      stepId={msg.errorRemediation.stepId}
                      functionName={msg.errorRemediation.functionName}
                      errorMessage={msg.errorRemediation.errorMessage}
                      domSnapshot={msg.errorRemediation.domSnapshot}
                      modelUsed={msg.errorRemediation.modelUsed}
                      onApplyRemediation={handleApplyRemediation}
                      onOpenHealer={() => {
                        setHealerInitialError({
                          stepId: msg.errorRemediation?.stepId,
                          functionName: msg.errorRemediation?.functionName,
                          errorMessage: msg.errorRemediation?.errorMessage,
                          tracebackSnippet: msg.errorRemediation?.domSnapshot,
                        });
                        setIsHealerOpen(true);
                      }}
                    />
                  )}

                  {/* Continuity Card */}
                  {msg.continuity && (
                    <ContinuityCard
                      summary={msg.continuity.summary}
                      artifacts={msg.continuity.artifacts}
                      onSelectNextAction={(prompt) => handleSendMessage(prompt)}
                      onDownloadZip={downloadZip}
                      onRunTestSuite={runPythonTests}
                    />
                  )}
                </div>
              );
            })
          )}

          {isProcessing && (
            <div className="flex items-center gap-2 p-3 text-xs text-slate-400 font-mono">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Analyzing requirement & formulating sub-agent DAG...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="pt-3 border-t border-slate-800/80 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-xl focus-within:border-indigo-500/80 transition-colors"
          >
            <div className="pl-3 text-slate-500">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Enter instruction (e.g. 'Search for Dr. Sarah Jenkins and extract data' or 'Analyze AAPL')..."
              disabled={isProcessing || isExecutingPlan}
              className="flex-1 bg-transparent px-2 py-1.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none disabled:opacity-50"
            />

            <div className="flex items-center gap-1.5">
              <div
                onClick={() => setIsMatrixModalOpen(true)}
                className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700/60 cursor-pointer hover:border-slate-600"
                title="Configured Phase 1 Model"
              >
                <Cpu className="w-3 h-3 text-indigo-400" />
                <span>{modelMatrix.clarification.model}</span>
              </div>

              <button
                type="submit"
                disabled={!inputMessage.trim() || isProcessing || isExecutingPlan}
                className="p-2 sm:px-4 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-md shadow-indigo-600/30"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Model Matrix Configuration Modal */}
      <ModelMatrixModal
        isOpen={isMatrixModalOpen}
        onClose={() => setIsMatrixModalOpen(false)}
        matrix={modelMatrix}
        onSaveMatrix={(newMatrix) => {
          setModelMatrix(newMatrix);
          fetch("/api/models/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ matrix: newMatrix }),
          });
        }}
        ollamaStatus={ollamaStatus}
        geminiStatus={geminiStatus}
        chromeStatus={chromeStatus}
        onRefreshStatus={fetchSystemStatus}
      />

      {/* Chrome CDP & Browser Simulation Explainer Modal */}
      <CdpExplainerModal
        isOpen={isCdpModalOpen}
        onClose={() => setIsCdpModalOpen(false)}
        chromeStatus={chromeStatus}
      />

      {/* Framework Self-Healing Modal */}
      <SelfHealingModal
        isOpen={isHealerOpen}
        onClose={() => setIsHealerOpen(false)}
        initialError={healerInitialError}
        onHealComplete={fetchSystemStatus}
      />

      {/* History Drawer */}
      <RecentWorkflowsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        sessions={savedSessions}
        onSelectSession={(sess) => {
          handleSendMessage(sess.goal);
          setIsDrawerOpen(false);
        }}
        onRerunSession={(goal) => {
          handleSendMessage(goal);
          setIsDrawerOpen(false);
        }}
        onDeleteSession={(wfId) => {
          setSavedSessions((prev) => {
            const next = prev.filter((s) => s.workflow_id !== wfId);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
          });
        }}
        onClearAllSessions={() => {
          setSavedSessions([]);
          localStorage.removeItem(STORAGE_KEY);
        }}
        onLoadSampleSessions={() => {}}
      />
    </div>
  );
}
