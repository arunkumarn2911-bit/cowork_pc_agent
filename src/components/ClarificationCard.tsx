import React, { useState } from "react";
import { HelpCircle, CheckCircle2, Send, Sparkles, Cpu, CornerDownRight } from "lucide-react";

interface ClarificationCardProps {
  id: string;
  question: string;
  options: string[];
  allowCustom?: boolean;
  modelUsed?: { provider: string; model: string };
  onSubmitChoice: (choice: string) => void;
  answeredChoice?: string | null;
}

export default function ClarificationCard({
  id,
  question,
  options,
  allowCustom = true,
  modelUsed,
  onSubmitChoice,
  answeredChoice,
}: ClarificationCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");
  const isAnswered = Boolean(answeredChoice);

  const handleSubmit = (choice: string) => {
    if (!choice.trim() || isAnswered) return;
    onSubmitChoice(choice.trim());
  };

  return (
    <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-5 my-4 shadow-xl shadow-indigo-950/20 backdrop-blur-sm text-slate-100">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              Requirement Clarification Needed
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Phase 1 Triage
              </span>
            </h4>
            <p className="text-xs text-slate-400">
              The LLM detected potential ambiguities or parameter choices in your request
            </p>
          </div>
        </div>

        {modelUsed && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-mono">
            {modelUsed.provider === "ollama" ? (
              <Cpu className="w-3 h-3 text-indigo-400" />
            ) : (
              <Sparkles className="w-3 h-3 text-amber-400" />
            )}
            <span>{modelUsed.model}</span>
          </div>
        )}
      </div>

      {/* Question */}
      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-sm font-medium text-slate-200 mb-4">
        {question}
      </div>

      {/* Options */}
      {isAnswered ? (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs font-medium text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Requirement Confirmed: <strong>{answeredChoice}</strong></span>
        </div>
      ) : (
        <div className="space-y-2">
          {options.map((opt, idx) => {
            const isRecommended = opt.includes("(Recommended)") || idx === 0;
            const cleanText = opt;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedOption(opt);
                  handleSubmit(opt);
                }}
                className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-between group ${
                  selectedOption === opt
                    ? "bg-indigo-600/30 border-indigo-500 text-white"
                    : isRecommended
                    ? "bg-indigo-950/30 border-indigo-800/60 hover:border-indigo-500/80 text-indigo-200 hover:bg-indigo-900/40"
                    : "bg-slate-800/40 border-slate-700/60 hover:border-slate-600 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[10px] font-mono text-slate-400 group-hover:border-indigo-400">
                    {idx + 1}
                  </span>
                  <span>{cleanText}</span>
                </div>
                <CornerDownRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </button>
            );
          })}

          {/* Custom Write-In Option */}
          {allowCustom && (
            <div className="pt-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit(customText);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Or enter custom instructions / parameters..."
                  className="flex-1 bg-slate-950/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!customText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  Confirm
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
