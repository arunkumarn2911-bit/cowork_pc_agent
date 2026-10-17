import React, { useState, useEffect } from "react";
import {
  X,
  Cpu,
  Sparkles,
  Server,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Terminal,
  ShieldCheck,
  Sliders,
  Copy,
  Check,
  Key,
  ExternalLink,
  Power,
  Square,
  Download,
  FileCode,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface ModelPhaseConfig {
  provider: "ollama" | "gemini";
  model: string;
  description: string;
  temperature: number;
}

export interface ModelMatrixState {
  clarification: ModelPhaseConfig;
  planning: ModelPhaseConfig;
  verification: ModelPhaseConfig;
  remediation: ModelPhaseConfig;
}

export interface GeminiModelItem {
  id: string;
  label: string;
  desc: string;
  version?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  matrix: ModelMatrixState;
  onSaveMatrix: (newMatrix: ModelMatrixState) => void;
  ollamaStatus: {
    online: boolean;
    models: string[];
    count: number;
    base_url?: string;
    daemon_pid?: number | null;
    error?: string;
    remediation_cmd?: string;
    pull_tip?: string;
  };
  geminiStatus: {
    connected: boolean;
    models: GeminiModelItem[];
    count: number;
    source?: string;
    error?: string;
  };
  chromeStatus: { connected: boolean; port: number; browser?: string };
  onRefreshStatus?: () => Promise<void>;
}

const PHASES: Array<{
  key: keyof ModelMatrixState;
  title: string;
  subtitle: string;
  defaultPreference: "gemini" | "ollama";
}> = [
  {
    key: "clarification",
    title: "Phase 1: Intent Triage & Clarification",
    subtitle: "Understands ambiguous user requirements and renders structured choice cards",
    defaultPreference: "gemini",
  },
  {
    key: "planning",
    title: "Phase 2: Action Plan (DAG) Generation",
    subtitle: "Decomposes requirement into ordered sub-agent steps with risk gating",
    defaultPreference: "gemini",
  },
  {
    key: "verification",
    title: "Phase 3: DOM & Artifact Verification",
    subtitle: "Validates post-conditions, DOM elements, and workspace JSON artifacts",
    defaultPreference: "ollama",
  },
  {
    key: "remediation",
    title: "Phase 4: Error Diagnosis & Recovery",
    subtitle: "Analyzes function execution failures and calculates recovery actions",
    defaultPreference: "gemini",
  },
];

export default function ModelMatrixModal({
  isOpen,
  onClose,
  matrix,
  onSaveMatrix,
  ollamaStatus,
  geminiStatus,
  chromeStatus,
  onRefreshStatus,
}: Props) {
  const [localMatrix, setLocalMatrix] = useState<ModelMatrixState>(matrix);
  const [testResults, setTestResults] = useState<
    Record<string, { loading: boolean; success?: boolean; latency_ms?: number; error?: string }>
  >({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Gemini JSON Config state
  const [showJsonConfig, setShowJsonConfig] = useState(false);
  const [jsonApiKeyInput, setJsonApiKeyInput] = useState("");
  const [jsonSaving, setJsonSaving] = useState(false);
  const [jsonConfigInfo, setJsonConfigInfo] = useState<{
    path: string;
    exists: boolean;
    source: string;
    has_key: boolean;
    masked_key: string;
    env_has_key: boolean;
  } | null>(null);
  const [jsonFeedback, setJsonFeedback] = useState<{ success?: boolean; msg?: string } | null>(null);

  // Ollama local daemon state
  const [daemonInfo, setDaemonInfo] = useState<{
    installed: boolean;
    binary_path: string | null;
    online: boolean;
    is_starting: boolean;
    pid: number | null;
    logs: string[];
    install_guide?: string;
  } | null>(null);
  const [isStartingDaemon, setIsStartingDaemon] = useState(false);
  const [isStoppingDaemon, setIsStoppingDaemon] = useState(false);
  const [daemonFeedback, setDaemonFeedback] = useState<{ success?: boolean; msg?: string } | null>(null);

  // Model pulling state
  const [isPullingModel, setIsPullingModel] = useState(false);
  const [pullFeedback, setPullFeedback] = useState<{ success?: boolean; msg?: string } | null>(null);

  // Ollama custom URL state
  const [showOllamaUrlInput, setShowOllamaUrlInput] = useState(false);
  const [inputOllamaUrl, setInputOllamaUrl] = useState(ollamaStatus.base_url || "http://127.0.0.1:11434");
  const [ollamaConnecting, setOllamaConnecting] = useState(false);
  const [ollamaConnectFeedback, setOllamaConnectFeedback] = useState<{ success?: boolean; msg?: string } | null>(null);

  useEffect(() => {
    setLocalMatrix(matrix);
  }, [matrix]);

  // Load JSON config and daemon status when modal opens
  const fetchAuxStatus = async () => {
    try {
      const [jsonRes, daemonRes] = await Promise.all([
        fetch("/api/config/gemini-json").then((r) => r.json()).catch(() => null),
        fetch("/api/models/ollama/daemon-status").then((r) => r.json()).catch(() => null),
      ]);
      if (jsonRes) setJsonConfigInfo(jsonRes);
      if (daemonRes) setDaemonInfo(daemonRes);
    } catch (e) {
      console.error("Aux status fetch error:", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAuxStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefreshStatus) {
        await onRefreshStatus();
      } else {
        await fetch("/api/models/discover");
      }
      await fetchAuxStatus();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Turn on local model daemon
  const handleStartLocalModel = async () => {
    setIsStartingDaemon(true);
    setDaemonFeedback(null);
    try {
      const res = await fetch("/api/models/ollama/start", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setDaemonFeedback({ success: true, msg: data.message });
        await handleRefresh();
      } else {
        setDaemonFeedback({
          success: false,
          msg: data.error || data.message || "Could not launch Ollama daemon",
        });
      }
    } catch (err: any) {
      setDaemonFeedback({ success: false, msg: err.message || "Network error" });
    } finally {
      setIsStartingDaemon(false);
      await fetchAuxStatus();
    }
  };

  // Stop local model daemon
  const handleStopLocalModel = async () => {
    setIsStoppingDaemon(true);
    try {
      const res = await fetch("/api/models/ollama/stop", { method: "POST" });
      const data = await res.json();
      setDaemonFeedback({ success: true, msg: data.message });
      await handleRefresh();
    } catch (err: any) {
      setDaemonFeedback({ success: false, msg: err.message || "Network error" });
    } finally {
      setIsStoppingDaemon(false);
      await fetchAuxStatus();
    }
  };

  // Pull local model (qwen2.5:3b)
  const handlePullModel = async (modelName = "qwen2.5:3b") => {
    setIsPullingModel(true);
    setPullFeedback(null);
    try {
      const res = await fetch("/api/models/ollama/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelName }),
      });
      const data = await res.json();
      if (data.success) {
        setPullFeedback({ success: true, msg: `Model '${modelName}' pulled successfully!` });
        await handleRefresh();
      } else {
        setPullFeedback({ success: false, msg: data.error || "Failed to pull model" });
      }
    } catch (e: any) {
      setPullFeedback({ success: false, msg: e.message || "Failed to trigger pull" });
    } finally {
      setIsPullingModel(false);
    }
  };

  // Save API key directly into gemini_config.json
  const handleSaveJsonApiKey = async () => {
    if (!jsonApiKeyInput.trim()) return;
    setJsonSaving(true);
    setJsonFeedback(null);
    try {
      const res = await fetch("/api/config/gemini-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: jsonApiKeyInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setJsonFeedback({
          success: true,
          msg: `Saved to gemini_config.json! Connected to Gemini (${data.gemini?.count || 0} models ready).`,
        });
        setJsonApiKeyInput("");
        await handleRefresh();
        setTimeout(() => setShowJsonConfig(false), 2000);
      } else {
        setJsonFeedback({
          success: false,
          msg: data.error || "Failed to write gemini_config.json",
        });
      }
    } catch (err: any) {
      setJsonFeedback({
        success: false,
        msg: err.message || "Network error contacting server",
      });
    } finally {
      setJsonSaving(false);
    }
  };

  const handleConnectOllamaUrl = async () => {
    if (!inputOllamaUrl.trim()) return;
    setOllamaConnecting(true);
    setOllamaConnectFeedback(null);
    try {
      const res = await fetch("/api/models/ollama/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl: inputOllamaUrl.trim() }),
      });
      const data = await res.json();
      if (data.online) {
        setOllamaConnectFeedback({
          success: true,
          msg: `Connected to Ollama! Detected ${data.count} installed models.`,
        });
        if (onRefreshStatus) await onRefreshStatus();
        setTimeout(() => setShowOllamaUrlInput(false), 1500);
      } else {
        setOllamaConnectFeedback({
          success: false,
          msg: data.error || "Could not reach Ollama at specified URL",
        });
      }
    } catch (err: any) {
      setOllamaConnectFeedback({
        success: false,
        msg: err.message || "Network error contacting server",
      });
    } finally {
      setOllamaConnecting(false);
    }
  };

  const handleProviderChange = (phaseKey: keyof ModelMatrixState, provider: "ollama" | "gemini") => {
    setLocalMatrix((prev) => {
      const current = prev[phaseKey];
      let fallbackModel = "";

      if (provider === "ollama") {
        fallbackModel = ollamaStatus.models[0] || "";
      } else {
        fallbackModel = geminiStatus.models[0]?.id || "";
      }

      return {
        ...prev,
        [phaseKey]: {
          ...current,
          provider,
          model: fallbackModel,
        },
      };
    });
  };

  const handleModelChange = (phaseKey: keyof ModelMatrixState, model: string) => {
    setLocalMatrix((prev) => ({
      ...prev,
      [phaseKey]: {
        ...prev[phaseKey],
        model,
      },
    }));
  };

  const runTest = async (phaseKey: keyof ModelMatrixState) => {
    const config = localMatrix[phaseKey];
    if (!config.model) {
      setTestResults((prev) => ({
        ...prev,
        [phaseKey]: { loading: false, success: false, error: "No model selected" },
      }));
      return;
    }

    setTestResults((prev) => ({ ...prev, [phaseKey]: { loading: true } }));

    try {
      const res = await fetch("/api/models/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: config.provider,
          model: config.model,
        }),
      });
      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [phaseKey]: {
          loading: false,
          success: data.success,
          latency_ms: data.latency_ms,
          error: data.error,
        },
      }));
    } catch (e: any) {
      setTestResults((prev) => ({
        ...prev,
        [phaseKey]: {
          loading: false,
          success: false,
          error: e.message || "Failed to reach endpoint",
        },
      }));
    }
  };

  const handleSave = () => {
    onSaveMatrix(localMatrix);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Live API & Model Configuration
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-medium">
                  Dynamic Discovery
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Connects directly to Gemini API via <code className="text-indigo-300 font-mono">gemini_config.json</code> and built-in Local Model manager.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Re-probe both Gemini API and Local Ollama"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh APIs</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Status & Connection Bars */}
        <div className="px-6 py-3 bg-slate-950/80 border-b border-slate-800 space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Gemini API Status Box & gemini_config.json card */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        geminiStatus.connected ? "bg-emerald-400 shadow-sm shadow-emerald-400" : "bg-rose-500"
                      }`}
                    />
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      Google Gemini API
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                      geminiStatus.connected
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {geminiStatus.connected ? `${geminiStatus.count} models verified` : "Disconnected"}
                  </span>
                </div>

                {/* JSON config file status indicator */}
                <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-300 mb-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="font-semibold text-slate-200">gemini_config.json:</span>
                    <span className="text-slate-400 truncate">
                      {jsonConfigInfo?.masked_key ? `${jsonConfigInfo.masked_key}` : "waiting for key"}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy("gemini_config.json")}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Copy file path"
                  >
                    {copiedCmd === "gemini_config.json" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="truncate max-w-[200px]">
                  {geminiStatus.connected
                    ? `Source: ${geminiStatus.source === "json" ? "gemini_config.json" : "Environment key"}`
                    : "Paste API key into gemini_config.json"}
                </span>
                <button
                  onClick={() => setShowJsonConfig(!showJsonConfig)}
                  className="text-indigo-400 hover:text-indigo-300 underline font-medium flex items-center gap-1"
                >
                  <Key className="w-3 h-3" />
                  {showJsonConfig ? "Close" : "Paste to JSON File"}
                </button>
              </div>

              {/* Collapsible Gemini JSON Editor */}
              {showJsonConfig && (
                <div className="mt-2.5 pt-2.5 border-t border-slate-800 space-y-2 animate-in fade-in duration-150">
                  <p className="text-[11px] text-slate-300">
                    Paste your Gemini API key below to write directly to <code className="text-indigo-300 font-mono">gemini_config.json</code>:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Paste Gemini API Key (e.g. AIzaSy...)"
                      value={jsonApiKeyInput}
                      onChange={(e) => setJsonApiKeyInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <button
                      onClick={handleSaveJsonApiKey}
                      disabled={jsonSaving || !jsonApiKeyInput.trim()}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                    >
                      {jsonSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Save to JSON
                    </button>
                  </div>
                  {jsonFeedback && (
                    <p className={`text-[11px] ${jsonFeedback.success ? "text-emerald-400" : "text-rose-400"}`}>
                      {jsonFeedback.msg}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-500">
                    Tip: You can also open <code className="text-slate-400 font-mono">gemini_config.json</code> in your local code editor and paste the key directly. The server watches the file and reloads instantly.
                  </p>
                </div>
              )}
            </div>

            {/* Built-in Local Model Daemon Status Box */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        ollamaStatus.online ? "bg-emerald-400 shadow-sm shadow-emerald-400" : "bg-amber-400"
                      }`}
                    />
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-amber-400" />
                      Local Model Daemon (Ollama)
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                      ollamaStatus.online
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {ollamaStatus.online
                      ? `${ollamaStatus.count} models installed`
                      : "Daemon Offline"}
                  </span>
                </div>

                {/* Built-in Turn On / Stop Action Area */}
                <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[11px]">
                    <Power className={`w-3.5 h-3.5 ${ollamaStatus.online ? "text-emerald-400" : "text-amber-400"}`} />
                    <span className="text-slate-300 font-medium">
                      {ollamaStatus.online
                        ? `Active on :11434 ${ollamaStatus.daemon_pid ? `(PID ${ollamaStatus.daemon_pid})` : ""}`
                        : daemonInfo?.installed
                        ? "Ollama installed & ready to start"
                        : "Built-in Daemon Controller"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!ollamaStatus.online ? (
                      <button
                        type="button"
                        onClick={handleStartLocalModel}
                        disabled={isStartingDaemon}
                        className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center gap-1 shadow-sm disabled:opacity-50 transition-colors"
                        title="Start local Ollama daemon with built-in code"
                      >
                        {isStartingDaemon ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Power className="w-3 h-3" />
                        )}
                        <span>Turn On Local Model</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handlePullModel("qwen2.5:3b")}
                          disabled={isPullingModel}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] flex items-center gap-1"
                          title="Pull recommended 3B model"
                        >
                          {isPullingModel ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                          Pull qwen2.5:3b
                        </button>
                        <button
                          type="button"
                          onClick={handleStopLocalModel}
                          disabled={isStoppingDaemon}
                          className="px-2 py-1 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-[10px] flex items-center gap-1"
                          title="Stop spawned daemon"
                        >
                          <Square className="w-3 h-3" />
                          Stop
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {daemonFeedback && (
                  <p className={`text-[11px] mb-1.5 ${daemonFeedback.success ? "text-emerald-400" : "text-amber-300"}`}>
                    {daemonFeedback.msg}
                  </p>
                )}
                {pullFeedback && (
                  <p className={`text-[11px] mb-1.5 ${pullFeedback.success ? "text-emerald-400" : "text-rose-400"}`}>
                    {pullFeedback.msg}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="truncate max-w-[200px]">
                  {ollamaStatus.online ? `Host: ${ollamaStatus.base_url}` : "Host: 127.0.0.1:11434"}
                </span>
                <button
                  onClick={() => setShowOllamaUrlInput(!showOllamaUrlInput)}
                  className="text-amber-400 hover:text-amber-300 underline font-medium flex items-center gap-1"
                >
                  <Server className="w-3 h-3" />
                  {showOllamaUrlInput ? "Close" : "Change Host"}
                </button>
              </div>

              {/* Collapsible Custom Ollama URL Input */}
              {showOllamaUrlInput && (
                <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="http://127.0.0.1:11434"
                      value={inputOllamaUrl}
                      onChange={(e) => setInputOllamaUrl(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <button
                      onClick={handleConnectOllamaUrl}
                      disabled={ollamaConnecting || !inputOllamaUrl.trim()}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white disabled:opacity-50 flex items-center gap-1"
                    >
                      {ollamaConnecting ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Probe"}
                    </button>
                  </div>
                  {ollamaConnectFeedback && (
                    <p className={`text-[11px] ${ollamaConnectFeedback.success ? "text-emerald-400" : "text-rose-400"}`}>
                      {ollamaConnectFeedback.msg}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Diagnostic Banner if Ollama is Offline */}
          {!ollamaStatus.online && (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span className="text-xs">
                  {daemonInfo?.installed === false
                    ? "Ollama is not installed on this machine yet. Click the copy button to install:"
                    : "Local model daemon is offline. Click 'Turn On Local Model' above or launch in terminal:"}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy("curl -fsSL https://ollama.com/install.sh | sh")}
                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[11px] font-mono border border-amber-500/30 text-amber-200 flex items-center gap-1.5"
                >
                  {copiedCmd === "curl -fsSL https://ollama.com/install.sh | sh" ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>Install Script</span>
                </button>
                <a
                  href="https://ollama.com/download"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[11px] font-mono border border-slate-700 text-slate-300 flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Download
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Phase Configuration List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {PHASES.map((phase) => {
            const config = localMatrix[phase.key];
            const test = testResults[phase.key];

            const availableOllama = ollamaStatus.models;
            const availableGemini = geminiStatus.models;

            // Check if current config.model is actually in the available list
            const isModelAvailable =
              config.provider === "ollama"
                ? availableOllama.includes(config.model)
                : availableGemini.some((m) => m.id === config.model);

            return (
              <div
                key={phase.key}
                className={`p-4 rounded-xl border transition-colors ${
                  !isModelAvailable && config.model
                    ? "bg-rose-950/20 border-rose-800/60"
                    : "bg-slate-800/50 border-slate-700/60 hover:border-slate-600"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                      {phase.title}
                      {!isModelAvailable && config.model && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium">
                          Model Not Connected
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{phase.subtitle}</p>
                  </div>

                  {/* Provider Radio Tabs */}
                  <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleProviderChange(phase.key, "gemini")}
                      className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                        config.provider === "gemini"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      Gemini
                      <span className="text-[10px] opacity-75">({availableGemini.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleProviderChange(phase.key, "ollama")}
                      className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                        config.provider === "ollama"
                          ? "bg-amber-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Cpu className="w-3 h-3" />
                      Ollama
                      <span className="text-[10px] opacity-75">({availableOllama.length})</span>
                    </button>
                  </div>
                </div>

                {/* Model Selection Dropdown: ONLY available models */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Assigned Model (Only Live & Connected Listed)
                    </label>

                    {config.provider === "gemini" ? (
                      availableGemini.length > 0 ? (
                        <select
                          value={config.model}
                          onChange={(e) => handleModelChange(phase.key, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                        >
                          {availableGemini.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.id} &bull; {m.label} ({m.version || "stable"})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                          <span className="text-rose-400 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            No Gemini models available (configure API key)
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowJsonConfig(true)}
                            className="text-xs text-indigo-400 underline font-medium"
                          >
                            Paste to gemini_config.json
                          </button>
                        </div>
                      )
                    ) : availableOllama.length > 0 ? (
                      <select
                        value={config.model}
                        onChange={(e) => handleModelChange(phase.key, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                      >
                        {availableOllama.map((name) => (
                          <option key={name} value={name}>
                            {name} (Local daemon)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                        <span className="text-amber-400 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          No local models detected on port 11434
                        </span>
                        <button
                          type="button"
                          onClick={handleStartLocalModel}
                          className="text-xs text-emerald-400 underline font-medium flex items-center gap-1"
                        >
                          <Power className="w-3 h-3" />
                          Turn On Local Model
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Latency Test Button & Result */}
                  <div className="flex items-center gap-2 pt-5">
                    <button
                      type="button"
                      onClick={() => runTest(phase.key)}
                      disabled={test?.loading || !config.model}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors disabled:opacity-40"
                    >
                      {test?.loading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      ) : (
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      Test Latency
                    </button>

                    {test && (
                      <div className="text-xs">
                        {test.loading && <span className="text-slate-400">Pinging...</span>}
                        {!test.loading && test.success && (
                          <span className="text-emerald-400 font-mono font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {test.latency_ms} ms
                          </span>
                        )}
                        {!test.loading && !test.success && (
                          <span
                            className="text-rose-400 font-mono text-[11px] truncate max-w-[150px] inline-block"
                            title={test.error}
                          >
                            {test.error || "Failed"}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Settings apply immediately to central WorkflowEngine</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  Saved Matrix!
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save & Apply Configuration
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
