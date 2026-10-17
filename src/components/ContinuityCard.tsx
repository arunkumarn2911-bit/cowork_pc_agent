import React from "react";
import {
  CheckCircle2,
  FileJson,
  Image,
  Download,
  Terminal,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface ContinuityCardProps {
  summary: string;
  artifacts: Array<{ filename: string; size_bytes?: number }>;
  onSelectNextAction: (actionPrompt: string) => void;
  onDownloadZip: () => void;
  onRunTestSuite: () => void;
}

export default function ContinuityCard({
  summary,
  artifacts,
  onSelectNextAction,
  onDownloadZip,
  onRunTestSuite,
}: ContinuityCardProps) {
  return (
    <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 my-4 shadow-xl shadow-emerald-950/20 backdrop-blur-sm text-slate-100">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-emerald-900/40">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            Execution Completed & Verified
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
              Phase 7 Continuity
            </span>
          </h4>
          <p className="text-xs text-slate-400">{summary}</p>
        </div>
      </div>

      {/* Verified Workspace Artifacts */}
      {artifacts.length > 0 && (
        <div className="mb-4">
          <div className="text-[11px] font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
            <span>Verified Workspace Artifacts:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {artifacts.map((art, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  {art.filename.endsWith(".png") ? (
                    <Image className="w-4 h-4 text-sky-400 shrink-0" />
                  ) : (
                    <FileJson className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span className="font-mono text-slate-200 truncate">{art.filename}</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-medium font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  Verified
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Continuity Prompt */}
      <div className="pt-3 border-t border-slate-800">
        <div className="text-xs font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>What is our next step?</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onDownloadZip}
            className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-200 flex items-center gap-2 transition-colors text-left"
          >
            <Download className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Download Full Python Agent ZIP</span>
          </button>

          <button
            type="button"
            onClick={onRunTestSuite}
            className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-200 flex items-center gap-2 transition-colors text-left"
          >
            <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Run 32-Test Verification Suite</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onSelectNextAction(
                "Open https://www.tradingview.com/chart/AAPL, inspect technical indicators on 1D timeframe, capture chart screenshot, extract RSI and moving averages, and save JSON."
              )
            }
            className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-200 flex items-center gap-2 transition-colors text-left"
          >
            <ArrowRight className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Analyze AAPL on TradingView</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onSelectNextAction(
                "Open the specified website https://medical-registry.internal/providers, search for Dr. Sarah Jenkins, open the matching record, extract its name, address and status, save a screenshot and JSON result in my workspace, verify the saved files, and summarize the result."
              )
            }
            className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-200 flex items-center gap-2 transition-colors text-left"
          >
            <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Healthcare Provider Extraction</span>
          </button>
        </div>
      </div>
    </div>
  );
}
