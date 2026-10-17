import React, { useState } from "react";
import {
  Globe,
  Info,
  CheckCircle2,
  Terminal,
  ShieldCheck,
  Zap,
  ExternalLink,
  X,
  Cpu,
  Play,
  Download,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface CdpExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  chromeStatus: {
    connected: boolean;
    port: number;
    browser?: string;
  };
  onRefreshStatus?: () => void;
}

export default function CdpExplainerModal({
  isOpen,
  onClose,
  chromeStatus,
  onRefreshStatus,
}: CdpExplainerModalProps) {
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchResult, setLaunchResult] = useState<{
    success: boolean;
    message: string;
    connected?: boolean;
  } | null>(null);

  if (!isOpen) return null;

  const handleAutoLaunch = async () => {
    setIsLaunching(true);
    setLaunchResult(null);
    try {
      const res = await fetch("/api/browser/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: "https://www.youtube.com" }),
      });
      const data = await res.json();
      setLaunchResult({
        success: data.success,
        message: data.message || "Launch command triggered.",
        connected: data.connected,
      });
      if (onRefreshStatus) onRefreshStatus();
    } catch (err: any) {
      setLaunchResult({
        success: false,
        message: `Failed to trigger launch: ${err.message}`,
      });
    } finally {
      setIsLaunching(false);
    }
  };

  const downloadWindowsBat = () => {
    window.location.href = "/api/browser/download-launcher";
  };

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
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-0.5">
                {chromeStatus.connected
                  ? "Connected to Live Chrome Browser"
                  : "Operating in Deterministic Simulated Mode"}
              </h4>
              <p className="text-xs opacity-90">
                {chromeStatus.connected
                  ? `Live WebSocket connection established on port ${chromeStatus.port}. The Browser Sub-Agent directly commands real web pages.`
                  : "No external Chrome browser is attached on port 9222. The agent automatically uses the built-in deterministic Python DOM engine, so all workflow actions, DOM parsing, and plan executions run safely with zero crashes."}
              </p>
            </div>
          </div>

          {/* 1-Click Auto-Launch Action Box */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm">
                <Zap className="w-4 h-4 text-indigo-400" />
                <span>Auto-Launch Chrome on Port 9222</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Built-in Automation
              </span>
            </div>

            <p className="text-slate-300">
              You do not have to type the command manually! When running locally on Windows, clicking below locates <code className="text-sky-300">chrome.exe</code> and starts it with <code className="text-emerald-300">--remote-debugging-port=9222</code> automatically:
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleAutoLaunch}
                disabled={isLaunching}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-indigo-500/25 transition-all"
              >
                {isLaunching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Launching Chrome...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Auto-Launch Chrome Now</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={downloadWindowsBat}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition-colors"
                title="Download double-clickable .bat script for Windows"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Download Windows Launcher (.bat)</span>
              </button>
            </div>

            {launchResult && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                  launchResult.connected
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                    : "bg-slate-900 border-slate-700 text-slate-300"
                }`}
              >
                {launchResult.connected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                )}
                <span>{launchResult.message}</span>
              </div>
            )}
          </div>

          {/* 3 Core Architecture Questions */}
          <div className="space-y-4">
            {/* Question 1: Why auto-launch is built in */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <div className="flex items-center gap-2 mb-2 text-sky-400 font-semibold text-sm">
                <Globe className="w-4 h-4" />
                <span>1. How Automatic Launching Works in the Framework</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                When you execute browser tasks locally or click <strong>Auto-Launch</strong>, the backend:
              </p>
              <ul className="mt-2 space-y-1 list-disc list-inside text-slate-400 pl-1">
                <li>Detects your OS (Windows, macOS, Linux)</li>
                <li>Finds <code className="text-sky-300">chrome.exe</code> across common installation directories</li>
                <li>Launches Chrome in the background with <code className="text-emerald-300">--remote-debugging-port=9222</code></li>
                <li>Connects sub-agents via WebSocket so actions occur live in your Chrome window</li>
              </ul>
            </div>

            {/* Question 2: Cloud Preview vs Desktop */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <div className="flex items-center gap-2 mb-2 text-amber-400 font-semibold text-sm">
                <Cpu className="w-4 h-4" />
                <span>2. Why does the Cloud Preview use Simulation?</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                In this cloud preview, code runs inside a remote Linux container in Google Cloud. A remote server cannot reach across the internet into your physical Windows laptop without a local bridge.
                Therefore, when running in the cloud, it uses the <strong>deterministic Python simulation harness</strong> to verify all steps safely.
              </p>
            </div>

            {/* Question 3: Manual Command reference */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <div className="flex items-center gap-2 mb-2 text-indigo-400 font-semibold text-sm">
                <Terminal className="w-4 h-4" />
                <span>3. Windows Command Reference (Optional)</span>
              </div>
              <p className="text-slate-300 leading-relaxed mb-2">
                If you ever prefer to launch it manually in CMD, you can use:
              </p>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400 select-all overflow-x-auto">
                "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="%TEMP%\agent-chrome-debug"
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Automatic Chrome CDP port 9222 detection active</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
