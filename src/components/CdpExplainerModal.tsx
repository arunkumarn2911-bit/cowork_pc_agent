import React from "react";
import {
  Globe,
  Info,
  CheckCircle2,
  Terminal,
  ShieldCheck,
  Zap,
  ExternalLink,
  X,
  Layers,
  Cpu,
} from "lucide-react";

interface CdpExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  chromeStatus: {
    connected: boolean;
    port: number;
    browser?: string;
  };
}

export default function CdpExplainerModal({
  isOpen,
  onClose,
  chromeStatus,
}: CdpExplainerModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Chrome CDP & Browser Automation
                </h2>
                <span
                  className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border ${
                    chromeStatus.connected
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  }`}
                >
                  {chromeStatus.connected ? "Port 9222 Active" : "Simulated Engine"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Chrome DevTools Protocol (CDP) for autonomous browser sub-agent control
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300 leading-relaxed">
          {/* Status summary banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              chromeStatus.connected
                ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-200"
                : "bg-amber-950/20 border-amber-500/30 text-amber-200"
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                chromeStatus.connected ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
              }`}
            >
              {chromeStatus.connected ? <CheckCircle2 className="w-4 h-4" /> : <Info className="w-4 h-4" />}
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-0.5">
                {chromeStatus.connected
                  ? "Connected to Live Chrome Browser"
                  : "Currently Operating in Deterministic Simulated Mode"}
              </h4>
              <p className="text-xs opacity-90">
                {chromeStatus.connected
                  ? `Live WebSocket connection established on port ${chromeStatus.port}. The Browser Sub-Agent directly commands real web pages.`
                  : "No external Chrome browser is attached on port 9222. The agent automatically uses the built-in deterministic Python DOM engine, so all workflow actions, DOM parsing, and plan executions run safely with zero crashes."}
              </p>
            </div>
          </div>

          {/* 3 Core Questions Explained */}
          <div className="space-y-4">
            {/* Question 1: What is CDP? */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <div className="flex items-center gap-2 mb-2 text-sky-400 font-semibold text-sm">
                <Zap className="w-4 h-4" />
                <span>1. What is CDP (Chrome DevTools Protocol)?</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                <strong>Chrome DevTools Protocol (CDP)</strong> is the low-level communication protocol used by automation tools like <em>Puppeteer</em>, <em>Playwright</em>, and <em>Selenium</em> to control Google Chrome or Chromium.
                It lets computer-use agents:
              </p>
              <ul className="mt-2 space-y-1 list-disc list-inside text-slate-400 pl-1">
                <li>Inspect and query the live DOM tree via CSS/XPath selectors</li>
                <li>Dispatch genuine hardware mouse clicks and keystrokes</li>
                <li>Capture pixel-accurate page screenshots (`Page.captureScreenshot`)</li>
                <li>Monitor and intercept network traffic without brittle visual OCR</li>
              </ul>
            </div>

            {/* Question 2: Why does it say "Simulated"? */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <div className="flex items-center gap-2 mb-2 text-amber-400 font-semibold text-sm">
                <Cpu className="w-4 h-4" />
                <span>2. Why does the icon say "CDP: Simulated"?</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Running a real full desktop Chrome instance requires a GUI display server, hundreds of megabytes of RAM, and active process permissions.
                In cloud development sandboxes or when Chrome is not launched in debugging mode, this system activates its <strong>high-fidelity Python Simulation Harness</strong>.
              </p>
              <p className="mt-2 text-slate-400">
                In Simulated Mode, the sub-agents execute real Python functions (`navigate_url`, `click_element`, `extract_text`, `save_json`), generate simulated DOM representations, and validate schemas without failing or hanging.
              </p>
            </div>

            {/* Question 3: How to connect a real Chrome browser? */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <div className="flex items-center gap-2 mb-2 text-indigo-400 font-semibold text-sm">
                <Terminal className="w-4 h-4" />
                <span>3. Optional: How to connect a Live Google Chrome</span>
              </div>
              <p className="text-slate-300 leading-relaxed mb-2">
                If you are running locally and wish to let the Browser Sub-Agent drive your actual Chrome window, start Chrome with the remote debugging flag enabled:
              </p>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400 select-all overflow-x-auto">
                google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/agent-chrome
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                On macOS: <code className="text-indigo-300">/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222</code>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sub-agents automatically adapt between Live CDP and Simulated mode</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
