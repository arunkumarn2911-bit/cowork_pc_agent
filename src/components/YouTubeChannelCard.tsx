import React from "react";
import {
  Youtube,
  CheckCircle2,
  ExternalLink,
  Play,
  Eye,
  Calendar,
  Sparkles,
} from "lucide-react";

export interface ChannelData {
  name: string;
  handle: string;
  verified: boolean;
  subscribers: string;
  videoCount: string;
  description: string;
  recentVideos: Array<{
    id: string;
    title: string;
    views: string;
    uploadDate: string;
    videoId: string;
  }>;
}

interface YouTubeChannelCardProps {
  channel: ChannelData;
  onPlayVideo?: (videoId: string, title: string) => void;
  onSelectAction?: (prompt: string) => void;
}

export default function YouTubeChannelCard({
  channel,
  onPlayVideo,
  onSelectAction,
}: YouTubeChannelCardProps) {
  return (
    <div className="bg-slate-900 border border-red-500/40 rounded-2xl p-5 my-4 shadow-xl shadow-red-950/20 backdrop-blur-sm text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-red-900/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
            <Youtube className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-bold text-white">{channel.name}</h4>
              {channel.verified && (
                <span className="w-3.5 h-3.5 rounded-full bg-slate-300 flex items-center justify-center text-black text-[9px] font-bold" title="Verified Channel">
                  ✓
                </span>
              )}
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-medium">
                Official YouTube Channel
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              {channel.handle} &bull; {channel.subscribers} &bull; {channel.videoCount}
            </p>
          </div>
        </div>

        <a
          href={`https://www.youtube.com/${channel.handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1 shrink-0"
        >
          <span>Open on YouTube</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-300 mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed">
        {channel.description}
      </p>

      {/* Recent Videos Section */}
      <div className="space-y-2 mb-4">
        <h5 className="text-xs font-semibold text-slate-300">Recent Video Uploads:</h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {channel.recentVideos.map((video) => (
            <div
              key={video.id}
              className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl hover:border-slate-700 transition-colors flex flex-col justify-between"
            >
              <div>
                <h6 className="text-xs font-medium text-slate-200 line-clamp-2 mb-1.5">
                  {video.title}
                </h6>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Eye className="w-2.5 h-2.5 text-slate-500" />
                    {video.views}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5 text-slate-500" />
                    {video.uploadDate}
                  </span>
                </div>
              </div>

              {onPlayVideo && (
                <button
                  type="button"
                  onClick={() => onPlayVideo(video.videoId, video.title)}
                  className="mt-2 w-full py-1 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-300 border border-red-500/30 text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <Play className="w-2.5 h-2.5" />
                  <span>Play Video</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Follow-up actions */}
      {onSelectAction && (
        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 text-[11px]">Next suggestions:</span>
          <button
            type="button"
            onClick={() => onSelectAction("Open YouTube and search for Tamil songs")}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
          >
            Search Tamil songs
          </button>
          <button
            type="button"
            onClick={() => onSelectAction("Open ChatGPT and type a prompt of need a Python code for adding two numbers and get back to me")}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
          >
            Ask ChatGPT for Python code
          </button>
        </div>
      )}
    </div>
  );
}
