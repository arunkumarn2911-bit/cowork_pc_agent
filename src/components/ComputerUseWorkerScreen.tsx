import React, { useState, useEffect } from "react";
import {
  Globe,
  MousePointer,
  ExternalLink,
  Keyboard,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Sparkles,
  Terminal,
  Play,
  RotateCw,
} from "lucide-react";

interface ComputerUseWorkerScreenProps {
  activeUrl?: string;
  activeFunction?: string | null;
  activeSubAgent?: string | null;
  isExecuting?: boolean;
  onOpenRealBrowser?: (url: string) => void;
}

export default function ComputerUseWorkerScreen({
  activeUrl = "https://www.youtube.com",
  activeFunction,
  activeSubAgent,
  isExecuting = false,
  onOpenRealBrowser,
}: ComputerUseWorkerScreenProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const [isClicking, setIsClicking] = useState(false);
  const [typedChars, setTypedChars] = useState("");
  const [screenMode, setScreenMode] = useState<"youtube" | "chatgpt" | "channel" | "general">("youtube");

  useEffect(() => {
    const urlLower = (activeUrl || "").toLowerCase();
    if (urlLower.includes("chatgpt") || urlLower.includes("openai")) {
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
      if (screenMode === "chatgpt") {
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
  }, [isExecuting, activeFunction, screenMode]);

  const targetUrl = activeUrl || (screenMode === "chatgpt" ? "https://chatgpt.com" : "https://www.youtube.com");

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl my-4 text-slate-100 transition-all">
      {/* Top Browser Chrome Bar */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-3">
        {/* Window controls & Worker Status */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <MousePointer className="w-3.5 h-3.5 text-indigo-400" />
            <span>Autonomous Worker Screen (Keyboard & Mouse Controller)</span>
          </div>
        </div>

        {/* Real browser launcher shortcut */}
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

      {/* Virtual Viewport Screen */}
      <div
        className={`relative bg-slate-950 overflow-hidden transition-all duration-300 select-none ${
          isExpanded ? "h-80" : "h-56"
        }`}
      >
        {/* Render simulated viewport matching the active URL */}
        {screenMode === "chatgpt" ? (
          <div className="p-4 h-full flex flex-col justify-between text-xs font-sans">
            {/* ChatGPT Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-[10px] text-white">
                  GPT
                </div>
                <span className="font-semibold text-slate-200">ChatGPT (OpenAI Workspace)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Model: GPT-4o</span>
            </div>

            {/* Conversation Flow */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 font-mono text-[11px]">
              {/* User Prompt */}
              <div className="flex justify-end">
                <div className="bg-indigo-600/90 text-white px-3 py-1.5 rounded-xl rounded-tr-sm max-w-[80%]">
                  {typedChars || "Write a Python code for adding two numbers"}
                </div>
              </div>

              {/* ChatGPT Response Output */}
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center text-[10px] shrink-0 font-bold">
                  AI
                </div>
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-slate-300 space-y-1.5 flex-1">
                  <p className="text-[10px] text-slate-400">Here is the Python script to add two numbers:</p>
                  <pre className="bg-slate-950 p-2 rounded text-emerald-400 text-[10px] overflow-x-auto border border-slate-800">
{`def add_numbers(a, b):
    return a + b

num1 = 15
num2 = 27
print(f"The sum is: {add_numbers(num1, num2)}")`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Simulated Input Field */}
            <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
              <div
                id="virtual-prompt-textarea"
                className={`flex-1 bg-slate-900 border rounded-xl px-3 py-1.5 text-[11px] text-slate-300 flex items-center justify-between ${
                  activeFunction === "fill_field" ? "border-indigo-500 shadow-sm shadow-indigo-500/30" : "border-slate-800"
                }`}
              >
                <span>{typedChars || "Message ChatGPT..."}</span>
                {activeFunction === "fill_field" && <span className="w-1.5 h-3 bg-indigo-400 animate-pulse" />}
              </div>
              <button
                type="button"
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  isClicking && activeFunction === "click_element"
                    ? "bg-emerald-500 text-black scale-95"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                &uarr;
              </button>
            </div>
          </div>
        ) : screenMode === "channel" ? (
          <div className="p-4 h-full flex flex-col justify-between text-xs">
            {/* Madan Gowri Channel Banner */}
            <div className="bg-gradient-to-r from-red-900/40 via-slate-900 to-indigo-900/40 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center font-bold text-lg text-white shadow-md">
                MG
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-white">Madan Gowri</h3>
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 fill-slate-200 text-black" />
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  @MadanGowri &bull; 7.82M subscribers &bull; 2.8K videos
                </p>
                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                  Daily news, geopolitics, science and tech explainer videos in Tamil.
                </p>
              </div>
            </div>

            {/* Video Cards Grid */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg">
                <div className="h-12 bg-slate-800 rounded flex items-center justify-center text-slate-500 text-[10px] mb-1">
                  [Video Thumbnail]
                </div>
                <div className="text-[10px] font-semibold text-slate-200 truncate">Iran vs Israel War Explained | MG</div>
                <div className="text-[9px] text-slate-400 font-mono">1.2M views &bull; 2 days ago</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg">
                <div className="h-12 bg-slate-800 rounded flex items-center justify-center text-slate-500 text-[10px] mb-1">
                  [Video Thumbnail]
                </div>
                <div className="text-[10px] font-semibold text-slate-200 truncate">Elon Musk Optimus Robots | Tamil</div>
                <div className="text-[9px] text-slate-400 font-mono">850K views &bull; 4 days ago</div>
              </div>
            </div>
          </div>
        ) : screenMode === "youtube" ? (
          /* YouTube Video / Songs Search Screen */
          <div className="p-4 h-full flex flex-col justify-between text-xs">
            {/* Search Header Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-4 bg-red-600 rounded flex items-center justify-center text-white text-[8px] font-bold">
                  &gt;
                </div>
                <span className="font-bold text-white text-xs tracking-tight">YouTube</span>
              </div>

              {/* Search Bar Input */}
              <div
                className={`flex-1 max-w-sm bg-slate-900 border rounded-full px-3 py-1 text-[11px] text-slate-200 flex items-center justify-between transition-all ${
                  activeFunction === "fill_field" ? "border-indigo-500 shadow-sm shadow-indigo-500/40" : "border-slate-800"
                }`}
              >
                <span>{typedChars || "tamil songs"}</span>
                {activeFunction === "fill_field" && <span className="w-1.5 h-3 bg-indigo-400 animate-pulse" />}
              </div>

              {/* Search Button */}
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

            {/* Results preview */}
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
                <div className="bg-slate-900/80 border border-slate-800/80 p-1.5 rounded flex items-center justify-between text-[10px]">
                  <span className="text-slate-200 font-medium truncate">3. Naa Ready - Leo (Anirudh)</span>
                  <span className="text-slate-400 font-mono shrink-0">290M views</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Dynamic Generic Website Viewport for ANY arbitrary URL */
          <div className="p-4 h-full flex flex-col justify-between text-xs font-sans">
            {/* Generic Website Navigation Bar */}
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

              {/* Dynamic Search / Input Field on the page */}
              <div
                className={`flex-1 max-w-sm bg-slate-900 border rounded-lg px-3 py-1.5 text-[11px] text-slate-200 flex items-center justify-between transition-all ${
                  activeFunction === "fill_field" ? "border-indigo-500 shadow-sm shadow-indigo-500/40" : "border-slate-800"
                }`}
              >
                <span className="truncate">{typedChars || `Query: ${targetUrl.split("/").pop() || "Active Session"}`}</span>
                {activeFunction === "fill_field" && <span className="w-1.5 h-3 bg-indigo-400 animate-pulse shrink-0" />}
              </div>

              {/* Submit / Action Button */}
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

            {/* Rendered DOM & Data Extraction Canvas */}
            <div className="flex-1 py-2.5 space-y-2 overflow-hidden">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3 h-3 text-indigo-400" />
                  <span>DOM Tree Inspected &bull; Target: {activeFunction || "ready"}</span>
                </div>
                <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Viewport Active
                </span>
              </div>

              {/* Interactive DOM content mockup tailored dynamically to URL */}
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
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    fn: {activeFunction || "inspect_dom"}
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    status: verified
                  </span>
                </div>
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
          {/* Arrow cursor */}
          <div className="relative">
            <svg
              className="w-5 h-5 text-amber-400 drop-shadow-md"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M4 0l16 12.279-6.951 1.17 4.325 8.817-3.596 1.734-4.35-8.879-5.428 5.879v-21z" />
            </svg>
            {/* Click ripple animation */}
            {isClicking && (
              <span className="absolute -top-1 -left-1 w-7 h-7 rounded-full bg-amber-400/40 animate-ping" />
            )}
            <span className="absolute left-4 top-2 text-[9px] font-mono bg-slate-900/90 text-amber-300 px-1 py-0.2 rounded border border-amber-500/30 whitespace-nowrap shadow">
              [Worker Cursor]
            </span>
          </div>
        </div>
      </div>

      {/* Worker Keystroke & Mouse Activity Telemetry Ticker */}
      <div className="bg-slate-950 px-4 py-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-2 truncate">
          <Keyboard className="w-3 h-3 text-indigo-400 shrink-0" />
          <span className="text-slate-300">
            {isExecuting
              ? `[Keyboard & Mouse Action] ${activeSubAgent || "browser_agent"}.${activeFunction || "active"} -> Coordinates: (${cursorPos.x}%, ${cursorPos.y}%)`
              : "Worker idle. Ready for your next dynamic prompt."}
          </span>
        </div>
        <span className="text-slate-500 shrink-0">Resolution: 1920x1080 (Simulated CDP)</span>
      </div>
    </div>
  );
}
