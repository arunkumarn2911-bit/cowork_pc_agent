import React from "react";
import {
  AlertTriangle,
  RotateCcw,
  Zap,
  SkipForward,
  Cpu,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  Terminal,
} from "lucide-react";

interface ErrorRemediationCardProps {
  stepId: string;
  functionName: string;
  errorMessage: string;
  domSnapshot?: string;
  tracebackSnippet?: string;
  modelUsed?: { provider: string; model: string };
  onApplyRemediation: (actionType: string) => void;
  onOpenHealer?: () => void;
  isRemediating?: boolean;
}

export default function ErrorRemediationCard({
  stepId,
  functionName,
  errorMessage,
  domSnapshot,
  tracebackSnippet,
  modelUsed,
  onApplyRemediation,
  onOpenHealer,
  isRemediating,
}: ErrorRemediationCardProps) {
  return (
    <div className="bg-rose-950/40 border border-rose-500/50 rounded-2xl p-5 my-4 shadow-xl shadow-rose-950/30 backdrop-blur-sm text-slate-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-rose-900/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-200 flex items-center gap-2">
              Circuit Breaker Tripped: Python Function Error
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                Phase 4 Auto-Remediation
              </span>
            </h4>
            <p className="text-xs text-rose-300/80">
              Execution safely halted to prevent cascading failure. Choose an automated recovery path:
            </p>
          </div>
        </div>

        {modelUsed && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-rose-800 text-[10px] text-slate-300 font-mono">
            {modelUsed.provider === "ollama" ? (
              <Cpu className="w-3 h-3 text-indigo-400" />
            ) : (
              <Sparkles className="w-3 h-3 text-amber-400" />
            )}
            <span>Diagnostic: {modelUsed.model}</span>
          </div>
        )}
      </div>

      {/* Error Details */}
      <div className="p-3 rounded-xl bg-slate-950/80 border border-rose-900/60 mb-4 font-mono text-xs">
        <div className="text-rose-400 font-bold mb-1 flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5" />
          Failed Function: <span className="text-white">{functionName}()</span>
        </div>
        <div className="text-slate-300 text-[11px] leading-relaxed">
          {errorMessage || "Locator matching '#btn-load-symbol' timed out after 3000ms. DOM element not interactable."}
        </div>
        {domSnapshot && (
          <div className="mt-2 text-[10px] text-slate-400 border-t border-slate-800 pt-1.5 truncate">
            Observed DOM Context: {domSnapshot}
          </div>
        )}
      </div>

      {/* Remediation Action Buttons */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-300 mb-1">
          Select Remediation Strategy:
        </div>

        <button
          type="button"
          onClick={() => onApplyRemediation("use_fallback_locator")}
          disabled={isRemediating}
          className="w-full text-left p-3 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/50 text-xs font-medium text-indigo-200 flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold text-white">Use Resilient Fuzzy Match Locator (Recommended)</span>
              <p className="text-[11px] text-indigo-300/70">
                Switches from strict CSS selector to semantic role/text locator matching visible DOM
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          type="button"
          onClick={() => onApplyRemediation("retry_with_timeout")}
          disabled={isRemediating}
          className="w-full text-left p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700/80 text-xs font-medium text-slate-200 flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-2.5">
            <RotateCcw className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <span className="font-semibold text-white">Retry Step with Extended Timeout (5000ms)</span>
              <p className="text-[11px] text-slate-400">
                Waits for dynamic SPA hydration or slow network responses
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          type="button"
          onClick={() => onApplyRemediation("skip_step")}
          disabled={isRemediating}
          className="w-full text-left p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700/80 text-xs font-medium text-slate-300 flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-2.5">
            <SkipForward className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold text-white">Skip Non-Critical Step</span>
              <p className="text-[11px] text-slate-400">
                Bypasses this specific action and proceeds to data extraction with available DOM
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {onOpenHealer && (
          <button
            type="button"
            onClick={onOpenHealer}
            disabled={isRemediating}
            className="w-full text-left p-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/50 text-xs font-medium text-emerald-200 flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-semibold text-white">Send to Healer Agent (Inspect Code Diff & Patch Framework)</span>
                <p className="text-[11px] text-emerald-300/70">
                  Leverages framework context + active model (Llama/Gemini) to propose code patch with Human-in-the-Loop approval
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
}
