import React, { useState, useMemo } from "react";
import {
  History,
  X,
  Search,
  Trash2,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  FileJson,
  Calendar,
  Filter,
  ArrowUpRight,
  ChevronRight,
  Download,
} from "lucide-react";

export interface SavedSession {
  workflow_id: string;
  goal: string;
  status: "PENDING" | "RUNNING" | "AWAITING_APPROVAL" | "AWAITING_CLARIFICATION" | "PAUSED" | "COMPLETED" | "FAILED" | "CANCELLED";
  created_at: number;
  current_stage: number;
  total_actions: number;
  elapsed_time: number;
  artifacts_count: number;
  summary?: string;
  workflow_snapshot?: any;
}

interface RecentWorkflowsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SavedSession[];
  onSelectSession: (session: SavedSession) => void;
  onRerunSession: (goal: string) => void;
  onDeleteSession: (workflow_id: string) => void;
  onClearAllSessions: () => void;
  onLoadSampleSessions: () => void;
}

export default function RecentWorkflowsDrawer({
  isOpen,
  onClose,
  sessions,
  onSelectSession,
  onRerunSession,
  onDeleteSession,
  onClearAllSessions,
  onLoadSampleSessions,
}: RecentWorkflowsDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "COMPLETED" | "ACTIVE" | "FAILED">("ALL");
  const [confirmClear, setConfirmClear] = useState(false);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesSearch =
        s.goal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.workflow_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.summary && s.summary.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === "ALL") return true;
      if (statusFilter === "COMPLETED") return s.status === "COMPLETED";
      if (statusFilter === "ACTIVE") return s.status === "RUNNING" || s.status === "PAUSED" || s.status === "AWAITING_APPROVAL";
      if (statusFilter === "FAILED") return s.status === "FAILED" || s.status === "CANCELLED";

      return true;
    });
  }, [sessions, searchQuery, statusFilter]);

  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp * 1000);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const exportHistoryJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sessions, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `cowork_workflow_history_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full z-10 text-slate-100 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold tracking-tight text-white uppercase">Recent Workflows</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {sessions.length} Saved
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Local storage session history and autonomous replays</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={exportHistoryJson}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
              title="Export session history to JSON"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-900/60">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search past sessions by goal or ID..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {(["ALL", "COMPLETED", "ACTIVE", "FAILED"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                    statusFilter === filter
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {sessions.length > 0 && (
              <div>
                {confirmClear ? (
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[11px] text-red-400 font-medium">Clear all?</span>
                    <button
                      onClick={() => {
                        onClearAllSessions();
                        setConfirmClear(false);
                      }}
                      className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="flex items-center space-x-1 text-[11px] text-slate-500 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
                <History className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-300">No matching sessions found</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  {searchQuery ? "Try refining your search query." : "Autonomous workflow runs are saved here for review and replay."}
                </p>
              </div>
              <button
                onClick={onLoadSampleSessions}
                className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 transition"
              >
                Load Sample History
              </button>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.workflow_id}
                className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all space-y-3 group shadow-sm hover:shadow-md"
              >
                {/* Header row: ID, Date, Status */}
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center space-x-2">
                    <span className="text-indigo-400 font-semibold">{session.workflow_id}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400">{formatDate(session.created_at)}</span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      session.status === "COMPLETED"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : session.status === "RUNNING"
                        ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30 animate-pulse"
                        : session.status === "AWAITING_APPROVAL"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        : "bg-red-500/10 text-red-400 border-red-500/30"
                    }`}
                  >
                    {session.status}
                  </span>
                </div>

                {/* Goal description */}
                <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed font-sans">
                  {session.goal}
                </p>

                {/* Metadata strip */}
                <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-900">
                  <span className="flex items-center space-x-1">
                    <Layers className="w-3 h-3 text-slate-500" />
                    <span>{session.current_stage} stages</span>
                  </span>
                  <span>·</span>
                  <span>{session.total_actions} actions</span>
                  <span>·</span>
                  <span className="flex items-center space-x-1">
                    <FileJson className="w-3 h-3 text-slate-500" />
                    <span>{session.artifacts_count} artifacts</span>
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs">
                  <div className="flex items-center space-x-2">
                    {/* Re-run button */}
                    <button
                      onClick={() => onRerunSession(session.goal)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] transition"
                      title="Run a fresh autonomous session with this goal"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Re-run</span>
                    </button>

                    {/* View / Inspect button */}
                    <button
                      onClick={() => onSelectSession(session)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition"
                      title="Load session state into workspace"
                    >
                      <span>Inspect</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => onDeleteSession(session.workflow_id)}
                    className="p-1 rounded text-slate-500 hover:text-red-400 transition"
                    title="Delete session from history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px]">Storage: Local Browser History</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
