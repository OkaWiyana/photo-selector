"use client";

import Link from "next/link";
import { EditingJob } from "@/lib/types/editor";

interface EditorHeaderProps {
  currentJob: EditingJob;
  onUpdateJobName: (name: string) => void;
  onOpenJobManager: () => void;
  onResetWorkspace: () => void;
  savedJobsCount: number;
}

export function EditorHeader({
  currentJob,
  onUpdateJobName,
  onOpenJobManager,
  onResetWorkspace,
  savedJobsCount,
}: EditorHeaderProps) {
  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
      <div className="mx-auto max-w-7xl px-4 py-3.5 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Navigation links */}
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-mono transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Admin</span>
          </Link>
          <span className="text-zinc-700 text-xs">/</span>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Editor Workspace
          </div>
        </div>

        {/* Center: Job Name Input */}
        <div className="flex items-center gap-2 flex-1 max-w-md min-w-[200px]">
          <span className="text-xs text-zinc-500 font-mono hidden sm:inline">Job:</span>
          <input
            type="text"
            value={currentJob.name}
            onChange={(e) => onUpdateJobName(e.target.value)}
            placeholder="Enter Job / Project Name (e.g. Jimmy Prewedding)..."
            className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-xs text-zinc-100 font-medium placeholder-zinc-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Right: Job Manager & Reset Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenJobManager}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-mono border border-zinc-800 transition-colors"
          >
            <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Saved Jobs ({savedJobsCount})</span>
          </button>

          <button
            type="button"
            onClick={onResetWorkspace}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900/60 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 text-xs font-mono transition-colors border border-zinc-800/60"
            title="Reset Workspace"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
}
