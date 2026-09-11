"use client";

import { useState } from "react";
import { MatchedPhoto, MatchStatus } from "@/lib/types/editor";

interface ResultTableSectionProps {
  matchedPhotos: MatchedPhoto[];
  onOpenCreateSetModal: () => void;
  hasScannedFolder: boolean;
}

export function ResultTableSection({
  matchedPhotos,
  onOpenCreateSetModal,
  hasScannedFolder,
}: ResultTableSectionProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | MatchStatus>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const totalCount = matchedPhotos.length;
  const readyCount = matchedPhotos.filter((m) => m.status === "ready").length;
  const rawMissingCount = matchedPhotos.filter((m) => m.status === "raw-missing").length;
  const jpgMissingCount = matchedPhotos.filter((m) => m.status === "jpg-missing").length;
  const notFoundCount = matchedPhotos.filter((m) => m.status === "not-found").length;

  const filteredPhotos = matchedPhotos.filter((item) => {
    // Filter by tab
    if (activeFilter !== "all" && item.status !== activeFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const filenameMatch = item.selection.filename.toLowerCase().includes(q);
      const basenameMatch = item.selection.basename.toLowerCase().includes(q);
      const jpgMatch = item.jpg?.name.toLowerCase().includes(q);
      const rawMatch = item.raw?.name.toLowerCase().includes(q);
      return filenameMatch || basenameMatch || Boolean(jpgMatch) || Boolean(rawMatch);
    }
    return true;
  });

  const isCreateSetDisabled = !hasScannedFolder || readyCount + rawMissingCount + jpgMissingCount === 0;

  return (
    <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-5 sm:p-6 transition-all flex flex-col gap-6">
      {/* Summary Header Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col justify-between">
          <span className="text-[11px] font-mono text-zinc-400">Total Selected</span>
          <span className="text-xl font-extrabold text-white font-mono mt-1">{totalCount}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex flex-col justify-between">
          <span className="text-[11px] font-mono text-emerald-400 font-medium">Ready</span>
          <span className="text-xl font-extrabold text-emerald-400 font-mono mt-1">{readyCount}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 flex flex-col justify-between">
          <span className="text-[11px] font-mono text-amber-400 font-medium">RAW Missing</span>
          <span className="text-xl font-extrabold text-amber-400 font-mono mt-1">{rawMissingCount}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-orange-950/30 border border-orange-800/40 flex flex-col justify-between">
          <span className="text-[11px] font-mono text-orange-400 font-medium">JPG Missing</span>
          <span className="text-xl font-extrabold text-orange-400 font-mono mt-1">{jpgMissingCount}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/40 col-span-2 sm:col-span-1 flex flex-col justify-between">
          <span className="text-[11px] font-mono text-rose-400 font-medium">Not Found</span>
          <span className="text-xl font-extrabold text-rose-400 font-mono mt-1">{notFoundCount}</span>
        </div>
      </div>

      {/* Controls Bar: Filter tabs, search, Create Set Button */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-2 border-t border-zinc-800/60">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 font-mono text-xs no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeFilter === "all"
                ? "bg-zinc-100 text-zinc-950 font-bold"
                : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800/60"
            }`}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("ready")}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeFilter === "ready"
                ? "bg-emerald-500 text-white font-bold"
                : "bg-zinc-950 text-zinc-400 hover:text-emerald-400 border border-zinc-800/60"
            }`}
          >
            Ready ({readyCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("raw-missing")}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeFilter === "raw-missing"
                ? "bg-amber-500 text-zinc-950 font-bold"
                : "bg-zinc-950 text-zinc-400 hover:text-amber-400 border border-zinc-800/60"
            }`}
          >
            RAW Missing ({rawMissingCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("jpg-missing")}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeFilter === "jpg-missing"
                ? "bg-orange-500 text-zinc-950 font-bold"
                : "bg-zinc-950 text-zinc-400 hover:text-orange-400 border border-zinc-800/60"
            }`}
          >
            JPG Missing ({jpgMissingCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("not-found")}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeFilter === "not-found"
                ? "bg-rose-500 text-white font-bold"
                : "bg-zinc-950 text-zinc-400 hover:text-rose-400 border border-zinc-800/60"
            }`}
          >
            Not Found ({notFoundCount})
          </button>
        </div>

        {/* Search & Action Button */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search filename..."
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none"
            />
            <svg
              className="h-4 w-4 text-zinc-500 absolute left-3 top-2.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <button
            type="button"
            onClick={onOpenCreateSetModal}
            disabled={isCreateSetDisabled}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 shrink-0 ${
              isCreateSetDisabled
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/40"
                : "bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-white shadow-lg shadow-emerald-950/40"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            <span>Create Editing Set</span>
          </button>
        </div>
      </div>

      {/* Result Table */}
      <div className="overflow-x-auto border border-zinc-800/80 rounded-xl bg-zinc-950">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">Client Selection</th>
              <th className="py-3 px-4">JPG Status</th>
              <th className="py-3 px-4">RAW Status</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Relative Path / Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filteredPhotos.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-zinc-500 font-sans">
                  {matchedPhotos.length === 0
                    ? "Paste client selection above or select local folder to start matching files."
                    : "No photo files match your current search / filter criteria."}
                </td>
              </tr>
            ) : (
              filteredPhotos.map((item, idx) => (
                <tr key={item.id} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="py-3 px-4 text-center text-zinc-500">{idx + 1}</td>
                  <td className="py-3 px-4 font-semibold text-white">
                    {item.selection.filename}
                  </td>

                  {/* JPG Status */}
                  <td className="py-3 px-4">
                    {item.jpg ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>JPG ({item.jpg.extension.toUpperCase()})</span>
                      </span>
                    ) : (
                      <span className="text-zinc-600 font-normal">✕ Missing</span>
                    )}
                  </td>

                  {/* RAW Status */}
                  <td className="py-3 px-4">
                    {item.raw ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-semibold text-amber-400">
                          {item.raw.extension.toUpperCase()}
                        </span>
                      </span>
                    ) : (
                      <span className="text-zinc-600 font-normal">✕ Missing</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4">
                    {item.status === "ready" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ✓ Ready
                      </span>
                    )}
                    {item.status === "raw-missing" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        ⚠ RAW Missing
                      </span>
                    )}
                    {item.status === "jpg-missing" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        ⚠ JPG Missing
                      </span>
                    )}
                    {item.status === "not-found" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        ✕ Not Found
                      </span>
                    )}
                  </td>

                  {/* Relative Path */}
                  <td className="py-3 px-4 text-right text-zinc-500 text-[11px] max-w-xs truncate">
                    {item.raw?.relativePath || item.jpg?.relativePath || "Not scanned locally"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
