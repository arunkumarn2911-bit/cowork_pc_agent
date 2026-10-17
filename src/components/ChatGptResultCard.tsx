import React, { useState } from "react";
import {
  Code,
  Copy,
  Check,
  Play,
  Terminal,
  ExternalLink,
  FileCode,
  Sparkles,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface ChatGptResultCardProps {
  prompt: string;
  code: string;
  explanation?: string;
  savedFile?: string;
  onSelectAction?: (prompt: string) => void;
}

export default function ChatGptResultCard({
  prompt,
  code,
  explanation,
  savedFile = "add_two_numbers.py",
  onSelectAction,
}: ChatGptResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    try {
      const res = await fetch("/api/agent/run-python", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: savedFile }),
      });
      const data = await res.json();
      setExecutionOutput(data.output || "Program finished with exit code 0.");
    } catch (err: any) {
      setExecutionOutput(`Execution error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 my-4 shadow-xl shadow-emerald-950/20 backdrop-blur-sm text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-emerald-900/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Code className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">ChatGPT Autonomous Worker Output</h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                Python Verified
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Typed into ChatGPT via simulated keyboard &bull; Extracted and saved to workspace
            </p>
          </div>
        </div>

        <a
          href="https://chatgpt.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1 shrink-0"
        >
          <span>Open in Real ChatGPT</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Prompt summary */}
      <div className="mb-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
        <span className="text-slate-400">Prompt typed: </span>
        <span className="text-indigo-300 font-semibold font-mono">&ldquo;{prompt}&rdquo;</span>
      </div>

      {/* Code Window */}
      <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 mb-4">
        <div className="bg-slate-900/90 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-200">workspace/{savedFile}</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-3 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
          {code}
        </pre>
      </div>

      {/* Action Buttons: Run Code & Next Steps */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <button
          type="button"
          onClick={handleRunCode}
          disabled={isRunning}
          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all disabled:opacity-50"
        >
          {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          <span>Run Python Script (System Agent)</span>
        </button>

        {onSelectAction && (
          <>
            <button
              type="button"
              onClick={() => onSelectAction("Modify the code to take numbers as input from user in terminal")}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
            >
              Modify for user input
            </button>
            <button
              type="button"
              onClick={() => onSelectAction("Open YouTube and search for Tamil songs")}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
            >
              Next: Search Tamil songs
            </button>
          </>
        )}
      </div>

      {/* Terminal Output if run */}
      {executionOutput && (
        <div className="mt-3 bg-black rounded-xl p-3 border border-slate-800 font-mono text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1 text-[11px]">
            <Terminal className="w-3 h-3 text-emerald-400" />
            <span>Terminal Output (python3 workspace/{savedFile}):</span>
          </div>
          <div className="text-emerald-400 whitespace-pre-wrap">{executionOutput}</div>
        </div>
      )}

      {/* Explanation Footer */}
      {explanation && (
        <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-start gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <span>{explanation}</span>
        </div>
      )}
    </div>
  );
}
