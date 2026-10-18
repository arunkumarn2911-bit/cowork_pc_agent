import React, { useState, useEffect } from "react";
import {
  Globe,
  MousePointer,
  ExternalLink,
  Keyboard,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Terminal,
  TrendingUp,
  BarChart2,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Folder,
  Database,
  Cpu,
  Clock,
  Play,
} from "lucide-react";
import { PlanStep } from "../types/agent";

interface ComputerUseWorkerScreenProps {
  activeUrl?: string;
  activeFunction?: string | null;
  activeSubAgent?: string | null;
  isExecuting?: boolean;
  onOpenRealBrowser?: (url: string) => void;
  dagSteps?: PlanStep[];
}

const AGENT_ICONS: Record<string, { label: string; icon: any; color: string }> = {
  browser_agent: { label: "Browser Agent", icon: Globe, color: "text-sky-400 bg-sky-500/10 border-sky-500/30" },
  data_agent: { label: "Data Agent", icon: Database, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  filesystem_agent: { label: "File Agent", icon: Folder, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  system_agent: { label: "System Agent", icon: Terminal, color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
};

export default function ComputerUseWorkerScreen({
  activeUrl = "https://www.youtube.com",
  activeFunction,
  activeSubAgent,
  isExecuting = false,
  onOpenRealBrowser,
  dagSteps = [],
}: ComputerUseWorkerScreenProps) {
  const [activeTab, setActiveTab] = useState<"screen" | "dag">("screen");
  const [isExpanded, setIsExpanded] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const [isClicking, setIsClicking] = useState(false);
  const [typedChars, setTypedChars] = useState("");
  const [screenMode, setScreenMode] = useState<"tradingview" | "youtube" | "chatgpt" | "channel" | "general">("youtube");

  // Determine current active ticker for TradingView
  const currentTicker = (() => {
    const urlLower = (activeUrl || "").toLowerCase();
    if (urlLower.includes("chart/")) {
      const parts = activeUrl.split("chart/");
      if (parts[1]) {
        return parts[1].split("/")[0].toUpperCase();
      }
    }
    if (urlLower.includes("btc")) return "BTCUSD";
    if (urlLower.includes("tsla")) return "TSLA";
    if (urlLower.includes("nvda")) return "NVDA";
    return "AAPL";
  })();

  useEffect(() => {
    const urlLower = (activeUrl || "").toLowerCase();
    if (urlLower.includes("tradingview") || urlLower.includes("trading view") || urlLower.includes("/chart/")) {
      setScreenMode("tradingview");
    } else if (urlLower.includes("chatgpt") || urlLower.includes("openai")) {
      setScreenMode("chatgpt");
    } else if (urlLower.includes("madangowri") || urlLower.includes("@madangowri")) {
      setScreenMode("channel");
    } else if (urlLower.includes("youtube") || urlLower.includes("song")) {
      setScreenMode("youtube");
    } else {
      setScreenMode("general");
    }
  }, [activeUrl]);

  // Simulate human worker mouse movements and keyboard typing during execution
  useEffect(() => {
    if (!isExecuting) {
      setIsClicking(false);
      return;
    }

    if (activeFunction === "open_url") {
      setCursorPos({ x: 45, y: 15 });
      setTypedChars("");
    } else if (activeFunction === "fill_field" || activeFunction === "type" || activeFunction === "inspect_dom") {
      setCursorPos({ x: 50, y: 35 });
      setIsClicking(true);
      const timer = setTimeout(() => setIsClicking(false), 400);

      // Keystroke animation
      if (screenMode === "tradingview") {
        setTypedChars(currentTicker);
      } else if (screenMode === "chatgpt") {
        setTypedChars("Write a Python code for adding two numbers");
      } else if (screenMode === "channel") {
        setTypedChars("Madan Gowri channel check");
      } else {
        setTypedChars("tamil songs");
      }
      return () => clearTimeout(timer);
    } else if (activeFunction === "click_element") {
      setCursorPos({ x: 78, y: 35 });
      setIsClicking(true);
      const timer = setTimeout(() => setIsClicking(false), 500);
      return () => clearTimeout(timer);
    } else if (activeFunction === "extract_structured_fields") {
      setCursorPos({ x: 50, y: 65 });
    }
  }, [isExecuting, activeFunction, screenMode, currentTicker]);

  const targetUrl = activeUrl || (
    screenMode === "tradingview" ? "https://www.tradingview.com" :
    screenMode === "chatgpt" ? "https://chatgpt.com" :
    "https://www.youtube.com"
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl my-4 text-slate-100 transition-all">
      {/* Top Browser Chrome Bar & Mode Switcher */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        {/* Window controls & View Selector (Viewport vs Dark DAG Plan) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>

          {/* Toggle between Live Screen and Dark DAG Plan */}
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("screen")}
              className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === "screen"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <MousePointer className="w-3 h-3" />
              <span>Live Viewport</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("dag")}
              className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === "dag"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Inspect sub-agent DAG execution graph"
            >
              <Layers className="w-3 h-3 text-amber-400" />
              <span>DAG Plan {dagSteps.length > 0 && `(${dagSteps.length})`}</span>
            </button>
          </div>
        </div>

        {/* Real browser launcher shortcut & Expand */}
        <div className="flex items-center gap-2">
          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-[11px] font-medium flex items-center gap-1 transition-colors"
            title="Open this exact URL in your actual Chrome browser tab"
          >
            <span>Open in Real Chrome</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-slate-400 hover:text-slate-200"
            title={isExpanded ? "Collapse screen view" : "Expand screen view"}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* URL Address Bar */}
      <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800/80 flex items-center gap-2 text-xs">
        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <div className="flex-1 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 truncate">
          {targetUrl}
        </div>
        {isExecuting && (
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Worker Active: {activeFunction || "operating"}</span>
          </div>
        )}
      </div>

      {/* VIEW 1: DARK DAG EXECUTION PLAN (as requested by user) */}
      {activeTab === "dag" ? (
        <div className={`p-4 bg-slate-950 overflow-y-auto font-mono text-xs ${isExpanded ? "h-80" : "h-64"}`}>
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Sub-Agent Execution Graph (DAG Plan)</span>
            </div>
            <span className="text-slate-500">Autonomous Deterministic Chain</span>
          </div>

          {dagSteps.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              <Layers className="w-6 h-6 mx-auto mb-2 opacity-40 text-slate-400" />
              <span>No active DAG steps pending. Formulate a workflow in chat to populate.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {dagSteps.map((step, idx) => {
                const badge = AGENT_ICONS[step.agent] || { label: step.agent, icon: Cpu, color: "text-slate-400 bg-slate-800 border-slate-700" };
                const Icon = badge.icon;
                const isCurrent = activeFunction === step.function || (isExecuting && idx === 0);

                return (
                  <div
                    key={step.id || idx}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isCurrent
                        ? "bg-slate-900 border-indigo-500/60 shadow-md shadow-indigo-500/10"
                        : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold">#{idx + 1}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 border ${badge.color}`}>
                          <Icon className="w-2.5 h-2.5" />
                          <span>{badge.label}</span>
                        </span>
                        <span className="text-slate-200 font-medium text-[11px] truncate">
                          {step.function}({Object.keys(step.arguments || {}).join(", ")})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {step.risk === "CONSEQUENTIAL" ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>APPROVAL</span>
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-0.5">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            <span>SAFE</span>
                          </span>
                        )}
                        {isCurrent ? (
                          <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Running
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">Verified</span>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-sans leading-normal line-clamp-1">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* VIEW 2: VIRTUAL VIEWPORT SCREEN */
        <div
          className={`relative bg-slate-950 overflow-hidden transition-all duration-300 select-none ${
            isExpanded ? "h-80" : "h-56"
          }`}
        >
          {/* TRADINGVIEW WORKSPACE VIEWPORT */}
          {screenMode === "tradingview" ? (
            <div className="p-3 h-full flex flex-col justify-between text-xs font-sans bg-[#131722] text-slate-200">
              {/* TradingView Top Navigation Bar */}
              <div className="flex items-center justify-between pb-2 border-b border-[#2a2e39] gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white font-black text-[10px]">
                    TV
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                    <span>TradingView</span>
                    <span className="text-[10px] text-slate-400 font-normal">| {currentTicker}</span>
                  </div>
                </div>

                {/* Symbol Search Bar */}
                <div
                  className={`flex-1 max-w-xs bg-[#1e222d] border rounded px-2.5 py-1 text-[11px] text-slate-200 flex items-center justify-between transition-all ${
                    activeFunction === "fill_field" ? "border-blue-500 shadow-sm shadow-blue-500/40" : "border-[#2a2e39]"
                  }`}
                >
                  <span className="font-mono">{typedChars || currentTicker}</span>
                  {activeFunction === "fill_field" && <span className="w-1.5 h-3 bg-blue-400 animate-pulse" />}
                  <span className="text-[9px] text-slate-500 font-mono">NASDAQ</span>
                </div>

                {/* Timeframe buttons */}
                <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-slate-400">
                  <span className="px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-400 border border-blue-500/30">1D</span>
                  <span className="px-1.5 py-0.5 rounded hover:bg-slate-800">1W</span>
                  <span className="px-1.5 py-0.5 rounded hover:bg-slate-800">1M</span>
                  <span className="px-1.5 py-0.5 rounded hover:bg-slate-800">1Y</span>
                </div>

                {/* Indicators Pill */}
                <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <Activity className="w-3 h-3" />
                  <span>RSI (14): 58.4</span>
                </div>
              </div>

              {/* Price Banner & Candlestick Chart Area */}
              <div className="flex-1 flex gap-2 py-1.5 overflow-hidden">
                {/* Main Candlestick Chart Area */}
                <div className="flex-1 flex flex-col justify-between bg-[#1e222d] rounded-lg p-2 border border-[#2a2e39] relative overflow-hidden">
                  {/* Price Banner */}
                  <div className="flex items-center justify-between text-[11px] font-mono z-10">
                    <div className="flex items-baseline gap-2">
                      <span className="text-white font-bold text-sm">
                        {currentTicker === "BTCUSD" ? "$67,420.50" : "$224.23"}
                      </span>
                      <span className="text-emerald-400 text-xs font-semibold">
                        ▲ +4.05 (+1.84%)
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Vol: 48.21M &bull; Prev Close: $220.18</span>
                  </div>

                  {/* SVG Candlestick Mockup */}
                  <div className="w-full h-24 my-auto relative flex items-center">
                    <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                      {/* Gridlines */}
                      <line x1="0" y1="20" x2="500" y2="20" stroke="#2a2e39" strokeDasharray="3 3" strokeWidth="0.5" />
                      <line x1="0" y1="50" x2="500" y2="50" stroke="#2a2e39" strokeDasharray="3 3" strokeWidth="0.5" />
                      <line x1="0" y1="80" x2="500" y2="80" stroke="#2a2e39" strokeDasharray="3 3" strokeWidth="0.5" />

                      {/* Moving Average Line (Gold) */}
                      <path
                        d="M 10 75 Q 80 65, 150 55 T 250 45 T 350 40 T 450 30 T 490 25"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="1.5"
                      />

                      {/* Candlesticks (green / red) */}
                      {/* Bar 1 - Green */}
                      <line x1="30" y1="55" x2="30" y2="85" stroke="#22c55e" strokeWidth="1" />
                      <rect x="25" y="62" width="10" height="18" fill="#22c55e" rx="1" />

                      {/* Bar 2 - Green */}
                      <line x1="65" y1="50" x2="65" y2="80" stroke="#22c55e" strokeWidth="1" />
                      <rect x="60" y="55" width="10" height="20" fill="#22c55e" rx="1" />

                      {/* Bar 3 - Red */}
                      <line x1="100" y1="48" x2="100" y2="78" stroke="#ef4444" strokeWidth="1" />
                      <rect x="95" y="52" width="10" height="16" fill="#ef4444" rx="1" />

                      {/* Bar 4 - Green */}
                      <line x1="135" y1="40" x2="135" y2="70" stroke="#22c55e" strokeWidth="1" />
                      <rect x="130" y="45" width="10" height="22" fill="#22c55e" rx="1" />

                      {/* Bar 5 - Green */}
                      <line x1="170" y1="35" x2="170" y2="65" stroke="#22c55e" strokeWidth="1" />
                      <rect x="165" y="40" width="10" height="20" fill="#22c55e" rx="1" />

                      {/* Bar 6 - Red pullback */}
                      <line x1="205" y1="38" x2="205" y2="68" stroke="#ef4444" strokeWidth="1" />
                      <rect x="200" y="44" width="10" height="15" fill="#ef4444" rx="1" />

                      {/* Bar 7 - Green breakout */}
                      <line x1="240" y1="28" x2="240" y2="60" stroke="#22c55e" strokeWidth="1" />
                      <rect x="235" y="32" width="10" height="24" fill="#22c55e" rx="1" />

                      {/* Bar 8 - Green */}
                      <line x1="275" y1="22" x2="275" y2="55" stroke="#22c55e" strokeWidth="1" />
                      <rect x="270" y="26" width="10" height="24" fill="#22c55e" rx="1" />

                      {/* Bar 9 - Red */}
                      <line x1="310" y1="24" x2="310" y2="56" stroke="#ef4444" strokeWidth="1" />
                      <rect x="305" y="28" width="10" height="18" fill="#ef4444" rx="1" />

                      {/* Bar 10 - Green rally */}
                      <line x1="345" y1="18" x2="345" y2="50" stroke="#22c55e" strokeWidth="1" />
                      <rect x="340" y="22" width="10" height="24" fill="#22c55e" rx="1" />

                      {/* Bar 11 - Green */}
                      <line x1="380" y1="15" x2="380" y2="45" stroke="#22c55e" strokeWidth="1" />
                      <rect x="375" y="18" width="10" height="22" fill="#22c55e" rx="1" />

                      {/* Bar 12 - Current candle */}
                      <line x1="415" y1="12" x2="415" y2="42" stroke="#22c55e" strokeWidth="1" />
                      <rect x="410" y="15" width="10" height="22" fill="#22c55e" rx="1" />

                      {/* Current Price Line */}
                      <line x1="0" y1="25" x2="500" y2="25" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 2" />
                    </svg>

                    {/* Price tag on right axis */}
                    <div className="absolute right-0 top-3 bg-blue-600 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-l font-bold shadow">
                      $224.23
                    </div>
                  </div>

                  {/* Bottom indicator status */}
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-[#2a2e39]">
                    <span>MACD (12, 26, 9): Bullish (+1.42)</span>
                    <span className="text-emerald-400">Market Open &bull; Real-time Feed</span>
                  </div>
                </div>

                {/* Right Watchlist Sidebar */}
                <div className="w-36 hidden sm:flex flex-col bg-[#1e222d] rounded-lg p-2 border border-[#2a2e39] text-[10px] font-mono">
                  <div className="text-slate-400 font-bold uppercase text-[9px] pb-1 border-b border-[#2a2e39] mb-1">
                    Watchlist
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between bg-blue-600/20 px-1 py-0.5 rounded border border-blue-500/30">
                      <span className="text-white font-bold">{currentTicker}</span>
                      <span className="text-emerald-400">+1.8%</span>
                    </div>
                    <div className="flex items-center justify-between px-1 py-0.5 text-slate-300">
                      <span>TSLA</span>
                      <span className="text-emerald-400">+3.1%</span>
                    </div>
                    <div className="flex items-center justify-between px-1 py-0.5 text-slate-300">
                      <span>NVDA</span>
                      <span className="text-emerald-400">+2.4%</span>
                    </div>
                    <div className="flex items-center justify-between px-1 py-0.5 text-slate-300">
                      <span>BTCUSD</span>
                      <span className="text-emerald-400">+4.2%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : screenMode === "chatgpt" ? (
            /* ChatGPT Screen */
            <div className="p-4 h-full flex flex-col justify-between text-xs font-sans">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-[10px] text-white">
                    GPT
                  </div>
                  <span className="font-semibold text-slate-200">ChatGPT (OpenAI Workspace)</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Model: GPT-4o</span>
              </div>
              <div className="flex-1 py-2 space-y-2 overflow-hidden">
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-slate-300 text-[11px]">
                  <span className="text-emerald-400 font-mono text-[10px] block mb-1">User Instruction:</span>
                  {typedChars || "Write a Python code for adding two numbers"}
                </div>
              </div>
            </div>
          ) : screenMode === "youtube" ? (
            /* YouTube Screen */
            <div className="p-4 h-full flex flex-col justify-between text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-4 bg-red-600 rounded flex items-center justify-center text-white text-[8px] font-bold">
                    &gt;
                  </div>
                  <span className="font-bold text-white text-xs tracking-tight">YouTube</span>
                </div>
                <div
                  className={`flex-1 max-w-sm bg-slate-900 border rounded-full px-3 py-1 text-[11px] text-slate-200 flex items-center justify-between transition-all ${
                    activeFunction === "fill_field" ? "border-indigo-500 shadow-sm shadow-indigo-500/40" : "border-slate-800"
                  }`}
                >
                  <span>{typedChars || "tamil songs"}</span>
                  {activeFunction === "fill_field" && <span className="w-1.5 h-3 bg-indigo-400 animate-pulse" />}
                </div>
                <button
                  type="button"
                  className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                    isClicking && activeFunction === "click_element"
                      ? "bg-indigo-600 text-white scale-95"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  Search
                </button>
              </div>

              <div className="flex-1 py-2 space-y-1.5 overflow-hidden">
                <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Verified Results Extracted: Top 5 Songs</span>
                </div>
                <div className="space-y-1">
                  <div className="bg-slate-900/80 border border-slate-800/80 p-1.5 rounded flex items-center justify-between text-[10px]">
                    <span className="text-slate-200 font-medium truncate">1. Arabic Kuthu - Beast (Anirudh)</span>
                    <span className="text-slate-400 font-mono shrink-0">580M views</span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800/80 p-1.5 rounded flex items-center justify-between text-[10px]">
                    <span className="text-slate-200 font-medium truncate">2. Rowdy Baby - Maari 2 (Yuvan Shankar Raja)</span>
                    <span className="text-slate-400 font-mono shrink-0">1.5B views</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Generic Web Viewport */
            <div className="p-4 h-full flex flex-col justify-between text-xs font-sans">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 text-xs">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200 text-xs truncate max-w-[200px]">
                      {(() => {
                        try {
                          return new URL(targetUrl).hostname.replace(/^www\./, "");
                        } catch {
                          return "Live Web Portal";
                        }
                      })()}
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      SSL Encrypted &bull; HTTP 200 OK
                    </span>
                  </div>
                </div>

                <div
                  className={`flex-1 max-w-sm bg-slate-900 border rounded-lg px-3 py-1.5 text-[11px] text-slate-200 flex items-center justify-between transition-all ${
                    activeFunction === "fill_field" ? "border-indigo-500 shadow-sm shadow-indigo-500/40" : "border-slate-800"
                  }`}
                >
                  <span className="truncate">{typedChars || `Session: ${targetUrl.split("/").pop() || "Active"}`}</span>
                  {activeFunction === "fill_field" && <span className="w-1.5 h-3 bg-indigo-400 animate-pulse shrink-0" />}
                </div>

                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    isClicking && activeFunction === "click_element"
                      ? "bg-indigo-600 text-white scale-95"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                  }`}
                >
                  Submit
                </button>
              </div>

              <div className="flex-1 py-2.5 space-y-2 overflow-hidden">
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-200">
                      Live Session: {targetUrl}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      sub_agent: {activeSubAgent || "browser_agent"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">
                    Operating on active DOM elements with deterministic selectors. Keystrokes, mouse coordinates, and viewport snapshots are monitored in real time.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Live Human Mouse Cursor Overlay */}
          <div
            className="absolute pointer-events-none transition-all duration-300 ease-out z-30"
            style={{
              left: `${cursorPos.x}%`,
              top: `${cursorPos.y}%`,
              transform: "translate(-2px, -2px)",
            }}
          >
            <div className="relative">
              <svg
                className="w-5 h-5 text-amber-400 drop-shadow-md"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M4 0l16 12.279-6.951 1.17 4.325 8.817-3.596 1.734-4.35-8.879-5.428 5.879v-21z" />
              </svg>
              {isClicking && (
                <span className="absolute -top-1 -left-1 w-7 h-7 rounded-full bg-amber-400/40 animate-ping" />
              )}
              <span className="absolute left-4 top-2 text-[9px] font-mono bg-slate-900/90 text-amber-300 px-1 py-0.2 rounded border border-amber-500/30 whitespace-nowrap shadow">
                [Worker Cursor]
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Worker Keystroke & Mouse Activity Telemetry Ticker */}
      <div className="bg-slate-950 px-4 py-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-2 truncate">
          <Keyboard className="w-3 h-3 text-indigo-400 shrink-0" />
          <span className="text-slate-300">
            {isExecuting
              ? `[Keyboard & Mouse Action] ${activeSubAgent || "browser_agent"}.${activeFunction || "active"} -> Coordinates: (${cursorPos.x}%, ${cursorPos.y}%)`
              : `Worker active in ${screenMode.toUpperCase()} mode. Ready for your prompt.`}
          </span>
        </div>
        <span className="text-slate-500 shrink-0">Resolution: 1920x1080 (Simulated CDP)</span>
      </div>
    </div>
  );
}
