import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  Music,
  ExternalLink,
  CheckCircle2,
  ListMusic,
  Volume2,
  Sparkles,
} from "lucide-react";

export interface SongItem {
  id: string;
  title: string;
  channel: string;
  views: string;
  duration: string;
  videoId: string;
}

interface MediaResultsCardProps {
  query: string;
  items: SongItem[];
  activeVideoId?: string;
  activeTitle?: string;
  autoPlay?: boolean;
  onPlaySong: (song: SongItem) => void;
  onSelectAction?: (prompt: string) => void;
}

export default function MediaResultsCard({
  query,
  items,
  activeVideoId: initialActiveVideoId,
  activeTitle: initialActiveTitle,
  autoPlay = false,
  onPlaySong,
  onSelectAction,
}: MediaResultsCardProps) {
  const [playingVideoId, setPlayingVideoId] = useState<string | undefined>(
    initialActiveVideoId || (autoPlay ? items[0]?.videoId : undefined)
  );
  const [playingTitle, setPlayingTitle] = useState<string | undefined>(
    initialActiveTitle || (autoPlay ? items[0]?.title : undefined)
  );

  // Sync state if initialActiveVideoId changes externally
  useEffect(() => {
    if (initialActiveVideoId) {
      setPlayingVideoId(initialActiveVideoId);
      setPlayingTitle(initialActiveTitle || "Selected Song");
    }
  }, [initialActiveVideoId, initialActiveTitle]);

  const handlePlayClick = (song: SongItem) => {
    setPlayingVideoId(song.videoId);
    setPlayingTitle(song.title);
    onPlaySong(song);
  };

  return (
    <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-5 my-4 shadow-xl shadow-indigo-950/20 backdrop-blur-sm text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-indigo-900/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">
                YouTube Search Results: &lsquo;{query}&rsquo;
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                Top {items.length} Songs
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Extracted by Data Sub-Agent &bull; Ready for instant automated playback
            </p>
          </div>
        </div>

        <a
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1 shrink-0"
        >
          <span>Open Results on YouTube</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Embedded Video Player if active */}
      {playingVideoId ? (
        <div className="mb-4 bg-slate-950 rounded-xl p-3 border border-indigo-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <Volume2 className="w-4 h-4 animate-pulse" />
              <span>Now Playing: {playingTitle}</span>
            </div>
            <a
              href={`https://www.youtube.com/watch?v=${playingVideoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <span>Watch on YouTube</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black shadow-lg">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${playingVideoId}?autoplay=1&enablejsapi=1`}
              title={playingTitle || "YouTube Video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      ) : (
        <div className="mb-4 bg-slate-950/80 rounded-xl p-3 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Volume2 className="w-4 h-4 text-slate-500" />
            <span>Video player is <strong>idle</strong>. Click <strong>Play</strong> on any song below or instruct <em>&ldquo;Play #1&rdquo;</em> to start.</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            User-Controlled Playback
          </span>
        </div>
      )}

      {/* List of Top Songs */}
      <div className="space-y-2 mb-4">
        <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
          <ListMusic className="w-3.5 h-3.5 text-indigo-400" />
          <span>Top Extracted Songs (Click Play to listen immediately):</span>
        </div>

        {items.map((song, idx) => {
          const isCurrent = playingVideoId === song.videoId;
          return (
            <div
              key={song.id || idx}
              className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                isCurrent
                  ? "bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-950/40"
                  : "bg-slate-950/60 hover:bg-slate-950/90 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-6 h-6 rounded-lg font-mono text-xs flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? "bg-indigo-600 text-white font-bold"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
                >
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <h5
                    className={`text-xs font-semibold truncate ${
                      isCurrent ? "text-indigo-200 font-bold" : "text-slate-200"
                    }`}
                  >
                    {song.title}
                  </h5>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                    <span className="text-slate-300">{song.channel}</span>
                    <span>&bull;</span>
                    <span className="font-mono text-emerald-400">{song.views}</span>
                    <span>&bull;</span>
                    <span className="font-mono text-slate-400">{song.duration}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handlePlayClick(song)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                    isCurrent
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{isCurrent ? "Playing" : "Play"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggested Follow-ups */}
      {onSelectAction && (
        <div className="pt-3 border-t border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Next Suggested Actions:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSelectAction(`Can you list me the top 5 songs with their view counts and details?`)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 transition-colors"
            >
              📋 List Top 5 Songs with Details
            </button>
            <button
              type="button"
              onClick={() => onSelectAction(`Play the first song: ${items[0]?.title || "Rowdy Baby"}`)}
              className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-[11px] text-indigo-300 transition-colors"
            >
              ▶ Play First Song (#1)
            </button>
            <button
              type="button"
              onClick={() => onSelectAction("Search YouTube for latest Tamil melody songs 2026")}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 transition-colors"
            >
              🔍 Search Tamil Melody Songs
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
