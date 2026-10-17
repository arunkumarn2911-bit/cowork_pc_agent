import React from "react";
import {
  ListChecks,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Globe,
  Database,
  Folder,
  Terminal,
  Zap,
  ExternalLink,
  Sparkles,
  Cpu,
} from "lucide-react";

export interface PlanStep {
  id: string;
  agent: "browser_agent" | "data_agent" | "filesystem_agent" | "system_agent" | string;
  function: string;
  arguments: Record<string, any>;
  description: string;
  risk: "SAFE" | "CONSEQUENTIAL";
  status?: "pending" | "running" | "success" | "error" | "blocked_approval";
  output?: any;
  duration_ms?: number;
  error_message?: string;
}

interface ActionPlanCardProps {
  summary: string;
  targetEnvironment?: string;
  steps: PlanStep[];
  modelUsed?: { provider: string; model: string };
  isApproved: boolean;
  onApprovePlan: () => void;
  onReplan: () => void;
  isExecuting?: boolean;
}

const AGENT_BADGES: Record<string, { label: string; icon: any; color: string }> = {
  browser_agent: { label: "Browser Agent", icon: Globe, color: "text-sky-400 bg-sky-500/10 border-sky-500/30" },
  data_agent: { label: "Data Agent", icon: Database, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  filesystem_agent: { label: "File Agent", icon: Folder, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  system_agent: { label: "System Agent", icon: Terminal, color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
};

export default function ActionPlanCard({
  summary,
  targetEnvironment,
  steps,
  modelUsed,
  isApproved,
  onApprovePlan,
  onReplan,
  isExecuting,
}: ActionPlanCardProps) {
  const hasConsequential = steps.some((s) => s.risk === "CONSEQUENTIAL");

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 my-4 shadow-xl backdrop-blur-sm text-slate-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <ListChecks className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              Proposed Action Plan (DAG)
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                Phase 2 Decomposed
              </span>
            </h4>
            <p className="text-xs text-slate-400">{summary}</p>
          </div>
        </div>

        {modelUsed && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-mono">
            {modelUsed.provider === "ollama" ? (
              <Cpu className="w-3 h-3 text-indigo-400" />
            ) : (
              <Sparkles className="w-3 h-3 text-amber-400" />
            )}
            <span>Planned by: {modelUsed.model}</span>
          </div>
        )}
      </div>

      {/* Target environment link */}
      {targetEnvironment && (
        <div className="mb-3 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
          <span className="text-slate-400">Target Environment:</span>
          <span className="font-mono text-indigo-300 flex items-center gap-1 truncate max-w-[320px]">
            {targetEnvironment}
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </span>
        </div>
      )}

      {/* Steps List */}
      <div className="space-y-2 mb-5">
        {steps.map((step, idx) => {
          const badge = AGENT_BADGES[step.agent] || {
            label: step.agent,
            icon: Zap,
            color: "text-slate-300 bg-slate-800 border-slate-700",
          };
          const Icon = badge.icon;
          const isSafe = step.risk === "SAFE";

          let statusIcon = <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-mono flex items-center justify-center text-slate-400 border border-slate-700">{idx + 1}</span>;
          if (step.status === "running") {
            statusIcon = <Clock className="w-5 h-5 text-indigo-400 animate-spin" />;
          } else if (step.status === "success") {
            statusIcon = <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
          } else if (step.status === "error") {
            statusIcon = <AlertTriangle className="w-5 h-5 text-rose-400" />;
          }

          return (
            <div
              key={step.id || idx}
              className={`p-3 rounded-xl border text-xs transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                step.status === "running"
                  ? "bg-indigo-950/40 border-indigo-500/50"
                  : step.status === "success"
                  ? "bg-slate-950/60 border-emerald-900/40"
                  : step.status === "error"
                  ? "bg-rose-950/30 border-rose-800/60"
                  : "bg-slate-950/40 border-slate-800"
              }`}
            >
              <div className="flex items-start sm:items-center gap-3">
                <div className="mt-0.5 sm:mt-0">{statusIcon}</div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-200">{step.description}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1 ${badge.color}`}>
                      <Icon className="w-3 h-3" />
                      {badge.label}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    function: <span className="text-indigo-300">{step.function}</span>({JSON.stringify(step.arguments)})
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono border font-medium ${
                    isSafe
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  }`}
                >
                  {isSafe ? "SAFE (Auto-Run)" : "CONSEQUENTIAL (Gated)"}
                </span>
                {step.duration_ms && (
                  <span className="text-[10px] font-mono text-slate-400">{step.duration_ms}ms</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Gating & Controls */}
      <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          {hasConsequential ? (
            <span className="flex items-center gap-1 text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              Contains consequential actions requiring explicit approval
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              All actions verified safe to execute
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onReplan}
            disabled={isExecuting}
            className="px-3 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs text-slate-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Replan
          </button>

          {!isApproved ? (
            <button
              type="button"
              onClick={onApprovePlan}
              disabled={isExecuting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              Approve Plan & Run Sub-Agents
            </button>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Plan Approved & Executing
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
