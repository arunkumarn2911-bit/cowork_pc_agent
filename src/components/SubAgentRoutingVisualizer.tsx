import React from "react";
import {
  Globe,
  Database,
  Folder,
  Terminal,
  Activity,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Cpu,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Info,
} from "lucide-react";

interface SubAgentVisualizerProps {
  activeAgent?: string | null;
  activeFunction?: string | null;
  activeRisk?: "SAFE" | "CONSEQUENTIAL";
  circuitBreakerTripped?: boolean;
  totalActionsExecuted?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenCdpInfo?: () => void;
}

const AGENTS = [
  {
    id: "browser_agent",
    name: "Browser Sub-Agent",
    protocol: "Chrome CDP :9222 / DOM",
    icon: Globe,
    color: "sky",
    bgClass: "bg-sky-500/10 border-sky-500/30 text-sky-400",
    activeClass: "bg-sky-500/20 border-sky-400 ring-2 ring-sky-400/40 text-sky-300",
    tasks: ["Navigate URLs", "DOM Inspection", "Click & Type", "Screenshot PNG"],
  },
  {
    id: "data_agent",
    name: "Data Sub-Agent",
    protocol: "Deterministic Python",
    icon: Database,
    color: "emerald",
    bgClass: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    activeClass: "bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-400/40 text-emerald-300",
    tasks: ["Extract Fields", "Schema Validate", "Calculate Metrics"],
  },
  {
    id: "filesystem_agent",
    name: "Filesystem Sub-Agent",
    protocol: "Workspace I/O",
    icon: Folder,
    color: "amber",
    bgClass: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    activeClass: "bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40 text-amber-300",
    tasks: ["Write JSON", "Verify SHA-256", "Workspace Audit"],
  },
  {
    id: "system_agent",
    name: "System Sub-Agent",
    protocol: "OS Subprocess",
    icon: Terminal,
    color: "rose",
    bgClass: "bg-rose-500/10 border-rose-500/30 text-rose-400",
    activeClass: "bg-rose-500/20 border-rose-400 ring-2 ring-rose-400/40 text-rose-300",
    tasks: ["Safe Diagnostics", "Consequential Shell (Gated)", "Process Status"],
  },
];

export default function SubAgentRoutingVisualizer({
  activeAgent,
  activeFunction,
  activeRisk,
  circuitBreakerTripped,
  totalActionsExecuted = 0,
  isCollapsed = false,
  onToggleCollapse,
  onOpenCdpInfo,
}: SubAgentVisualizerProps) {
  // If user minimized or collapsed the architecture to maximize chat window:
  if (isCollapsed) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 mb-3 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3 text-xs transition-all">
        {/* Left: Indicator & Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-slate-200">
            Hub-and-Spoke Routing
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/80 hidden sm:inline">
            4 Sub-Agents
          </span>
        </div>

        {/* Center: Live Sub-Agent or Status Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {activeAgent ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[11px] font-mono animate-pulse">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold">
                {activeAgent.replace("_", " ")}:
              </span>
              <span>{activeFunction || "active"}()</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-indigo-600/40 text-white font-bold">
                {activeRisk || "SAFE"}
              </span>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/70 border border-slate-700/50">
                <Globe className="w-3 h-3 text-sky-400" /> Browser (CDP)
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/70 border border-slate-700/50">
                <Database className="w-3 h-3 text-emerald-400" /> Data
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/70 border border-slate-700/50">
                <Folder className="w-3 h-3 text-amber-400" /> Filesystem
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/70 border border-slate-700/50">
                <Terminal className="w-3 h-3 text-rose-400" /> System
              </span>
            </div>
          )}
        </div>

        {/* Right: Circuit Breaker + Expand Button */}
        <div className="flex items-center gap-2">
          <div
            className={`px-2.5 py-0.5 rounded-full border text-[11px] flex items-center gap-1 font-medium ${
              circuitBreakerTripped
                ? "bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            }`}
          >
            {circuitBreakerTripped ? (
              <>
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span className="hidden sm:inline">Tripped</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">Breaker Safe</span>
              </>
            )}
          </div>

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1 transition-colors"
              title="Expand architecture details"
            >
              <Eye className="w-3 h-3 text-indigo-400" />
              <span>Show Diagram</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Expanded View:
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-4 backdrop-blur-sm transition-all duration-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Hub-and-Spoke Routing Architecture
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Zero Inter-Agent LLM Chatter
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Deterministic Python dispatcher passes structured JSON parameters and return values
            </p>
          </div>
        </div>

        {/* Right Controls: Circuit Breaker Pill + Hide Button */}
        <div className="flex items-center gap-2 text-xs">
          <div
            className={`px-2.5 py-1 rounded-full border flex items-center gap-1.5 font-medium ${
              circuitBreakerTripped
                ? "bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            }`}
          >
            {circuitBreakerTripped ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Circuit Breaker: Tripped (Paused)</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Circuit Breaker: Normal</span>
              </>
            )}
          </div>

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Hide this architecture panel to expand chat view"
            >
              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              <span>Hide / Compact</span>
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Grid of Sub-Agents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {AGENTS.map((agent) => {
          const Icon = agent.icon;
          const isActive = activeAgent === agent.id;

          return (
            <div
              key={agent.id}
              className={`p-3 rounded-xl border transition-all duration-300 relative overflow-hidden ${
                isActive ? agent.activeClass : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              {isActive && (
                <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-pulse" />
              )}

              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                      isActive ? "bg-white/10 border-white/30 text-white" : agent.bgClass
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">{agent.name}</h4>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500 font-mono">{agent.protocol}</span>
                      {agent.id === "browser_agent" && onOpenCdpInfo && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenCdpInfo();
                          }}
                          className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-0.5 underline decoration-sky-500/40"
                          title="Click to learn what Chrome CDP is and how Simulated mode works"
                        >
                          <Info className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {isActive && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold animate-pulse">
                    ACTIVE
                  </span>
                )}
              </div>

              {isActive && activeFunction ? (
                <div className="mt-2 p-2 rounded-lg bg-black/40 border border-indigo-500/30 text-[11px] font-mono">
                  <div className="text-indigo-300 flex items-center gap-1 font-semibold">
                    <Zap className="w-3 h-3 text-amber-400" />
                    fn: {activeFunction}()
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                    <span>Risk: {activeRisk || "SAFE"}</span>
                    <span className="text-emerald-400">Dispatching...</span>
                  </div>
                </div>
              ) : (
                <div className="mt-1.5 space-y-1">
                  {agent.tasks.slice(0, 3).map((t, idx) => (
                    <div key={idx} className="text-[10px] text-slate-400 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-slate-600" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

