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
  targetEnvironment?: string;
}

export default function ContinuityCard({
  summary,
  artifacts,
  onSelectNextAction,
  onDownloadZip,
  onRunTestSuite,
  targetEnvironment = "",
}: ContinuityCardProps) {
  const envLower = (targetEnvironment + " " + summary).toLowerCase();

  // Dynamic context-aware next step suggestions
  let dynamicSuggestions = [
    {
      label: "Inspect DOM interactive elements",
      prompt: `Inspect the active DOM view on ${targetEnvironment || "the current page"} and list all buttons and input selectors.`,
    },
    {
      label: "Capture high-resolution screenshot",
      prompt: `Capture a full viewport PNG verification screenshot of ${targetEnvironment || "the current page"} and save to workspace.`,
    },
    {
      label: "Extract page text into structured JSON",
      prompt: `Extract main text and headers from ${targetEnvironment || "the current page"} into a structured JSON artifact.`,
    },
    {
      label: "Navigate to a new web destination",
      prompt: "Open Chrome, navigate to Google, and search for autonomous AI agent frameworks.",
    },
  ];

  if (envLower.includes("youtube")) {
    dynamicSuggestions = [
      {
        label: "Search YouTube for 'autonomous AI agents'",
        prompt: "On YouTube, type 'autonomous AI agents' in the search bar, click search, and inspect the results.",
      },
      {
        label: "Extract top 5 video titles & channels",
        prompt: "Extract the titles, channel names, and view counts of the top 5 videos on the active YouTube page into JSON.",
      },
      {
        label: "Inspect YouTube Trending section",
        prompt: "Navigate to https://www.youtube.com/feed/trending, capture a verification screenshot, and extract trending topics.",
      },
      {
        label: "Open a different web portal",
        prompt: "Open https://github.com/trending, inspect popular AI repositories, and save artifact.",
      },
    ];
  } else if (envLower.includes("tradingview") || envLower.includes("aapl") || envLower.includes("stock")) {
    dynamicSuggestions = [
      {
        label: "Extract RSI & Moving Averages (1D)",
        prompt: "Inspect AAPL chart on 1D timeframe, extract RSI(14) and 50/200 SMA values, and save JSON artifact.",
      },
      {
        label: "Switch chart to Tesla (TSLA)",
        prompt: "Type 'TSLA' in the symbol search, load daily chart, capture verification screenshot, and extract volume.",
      },
      {
        label: "Inspect 4-Hour timeframe with MACD",
        prompt: "Switch timeframe to 4H, read MACD histogram, and verify indicator stability.",
      },
      {
        label: "Export full technical summary",
        prompt: "Compile technical indicators into aapl_technical_summary.json and verify schema hash.",
      },
    ];
  } else if (envLower.includes("google")) {
    dynamicSuggestions = [
      {
        label: "Click on first search result",
        prompt: "Click on the first organic search result link, wait for navigation, and capture screenshot.",
      },
      {
        label: "Extract search result titles & URLs",
        prompt: "Extract all search result titles, snippets, and destination URLs into google_results.json.",
      },
      {
        label: "Search for Python Playwright automation",
        prompt: "Enter query 'Python Playwright headless browser control' into Google search and inspect DOM.",
      },
      {
        label: "Navigate to target portal",
        prompt: "Open https://www.youtube.com and verify page container.",
      },
    ];
  }

  return (
    <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 my-4 shadow-xl shadow-emerald-950/20 backdrop-blur-sm text-slate-100">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-emerald-900/40">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              Execution Completed & Verified
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                Phase 7 Continuity
              </span>
            </h4>
            {targetEnvironment && (
              <div className="flex items-center gap-2">
                <a
                  href={targetEnvironment}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[11px] font-mono text-emerald-300 hover:text-emerald-200 flex items-center gap-1.5 transition-colors"
                  title="Click to open this URL directly in your browser"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Open {targetEnvironment.replace(/^https?:\/\/(?:www\.)?/, "")} in New Tab</span>
                </a>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-300 mt-0.5">{summary}</p>
        </div>
      </div>

      {/* Cloud vs Desktop Local Mode Notice */}
      <div className="mb-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shrink-0"></span>
          <div>
            <span className="font-semibold text-slate-200">Execution Mode: </span>
            <span className="text-sky-300 font-mono">Cloud Sandbox (Headless Virtual Engine)</span>
            <span className="text-slate-400 block sm:inline sm:ml-1 text-[11px]">
              — Navigated and verified headlessly in the cloud container.
            </span>
          </div>
        </div>
        {targetEnvironment && (
          <a
            href={targetEnvironment}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 shrink-0 transition-colors"
          >
            <span>Launch Webpage</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
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

      {/* Continuity Prompt & Next Steps */}
      <div className="pt-3 border-t border-slate-800">
        <div className="text-xs font-semibold text-slate-200 mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>The current step is completed! What would you like to execute next?</span>
          </div>
          <span className="text-[10px] text-slate-400">Click a suggestion or type below</span>
        </div>

        {/* Dynamic Contextual Next Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
          {dynamicSuggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectNextAction(item.prompt)}
              className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 hover:border-indigo-500/50 border border-slate-800 text-xs text-slate-200 flex items-center gap-2 transition-all text-left group"
            >
              <ArrowRight className="w-4 h-4 text-indigo-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Global Utilities */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/60">
          <button
            type="button"
            onClick={onDownloadZip}
            className="p-2 rounded-xl bg-slate-950/40 hover:bg-slate-800/80 border border-slate-800 text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Download Framework ZIP</span>
          </button>

          <button
            type="button"
            onClick={onRunTestSuite}
            className="p-2 rounded-xl bg-slate-950/40 hover:bg-slate-800/80 border border-slate-800 text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Run 32-Test Verification Suite</span>
          </button>
        </div>
      </div>
    </div>
  );
}
