"use client";

import { useState } from "react";
import { MatchedPhoto, CopyProgress, EditingSetCopyMode } from "@/lib/types/editor";
import { copyEditingSetFiles } from "@/lib/services/editor-file-scanner";

interface CreateSetModalProps {
  matchedPhotos: MatchedPhoto[];
  rootHandle?: FileSystemDirectoryHandle;
  onClose: () => void;
}

export function CreateSetModal({
  matchedPhotos,
  rootHandle,
  onClose,
}: CreateSetModalProps) {
  const [copyMode, setCopyMode] = useState<EditingSetCopyMode>("raw-preferred");
  const [copyProgress, setCopyProgress] = useState<CopyProgress>({
    copiedCount: 0,
    totalCount: 0,
    isCopying: false,
    errorCount: 0,
  });
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Compute counts dynamically based on selected copyMode
  const readyPhotos = matchedPhotos.filter((m) => m.jpg || m.raw);

  let targetFilesCount = 0;
  let targetRawCount = 0;
  let targetJpgCount = 0;

  for (const match of readyPhotos) {
    if (copyMode === "raw-preferred") {
      if (match.raw) {
        targetRawCount++;
        targetFilesCount++;
      } else if (match.jpg) {
        targetJpgCount++;
        targetFilesCount++;
      }
    } else if (copyMode === "all") {
      if (match.jpg) targetJpgCount++;
      if (match.raw) targetRawCount++;
      targetFilesCount = targetJpgCount + targetRawCount;
    } else if (copyMode === "raw-only") {
      if (match.raw) {
        targetRawCount++;
        targetFilesCount++;
      }
    }
  }

  const handleStartCopying = async () => {
    if (!rootHandle) return;

    setCopyProgress({
      copiedCount: 0,
      totalCount: targetFilesCount,
      isCopying: true,
      errorCount: 0,
    });

    const result = await copyEditingSetFiles(
      readyPhotos,
      rootHandle,
      "_EDIT",
      copyMode,
      (copied, total, currentName) => {
        setCopyProgress((prev) => ({
          ...prev,
          copiedCount: copied,
          totalCount: total,
          currentFilename: currentName,
        }));
      }
    );

    setCopyProgress((prev) => ({
      ...prev,
      isCopying: false,
      errorCount: result.errorCount,
    }));
    setIsCompleted(true);
  };

  const handleDownloadManifest = () => {
    const lines: string[] = ["=== KALA ARCHIVES EDITING SET MANIFEST ===", ""];

    lines.push(`Total Client Selections: ${matchedPhotos.length}`);
    lines.push(`Copy Mode: ${copyMode}`);
    lines.push(`Estimated Files: ${targetFilesCount} (${targetRawCount} RAW, ${targetJpgCount} JPG)`);
    lines.push("");
    lines.push("--- FILES LIST ---");

    for (const match of matchedPhotos) {
      if (copyMode === "all") {
        if (match.jpg) lines.push(`[JPG] ${match.jpg.relativePath || match.jpg.name}`);
        if (match.raw) lines.push(`[RAW] ${match.raw.relativePath || match.raw.name}`);
      } else if (copyMode === "raw-preferred") {
        if (match.raw) {
          lines.push(`[RAW] ${match.raw.relativePath || match.raw.name}`);
        } else if (match.jpg) {
          lines.push(`[JPG Fallback] ${match.jpg.relativePath || match.jpg.name}`);
        }
      } else if (copyMode === "raw-only") {
        if (match.raw) lines.push(`[RAW] ${match.raw.relativePath || match.raw.name}`);
      }
    }

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `editing_set_manifest_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col p-5 sm:p-6 text-zinc-100 shadow-2xl overflow-hidden">
        
        {/* Sticky Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-snug">Create Editing Set</h3>
              <p className="text-xs text-zinc-400">Prepare photo manifest & copy local edit files</p>
            </div>
          </div>

          {!copyProgress.isCopying && (
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1.5 rounded-lg hover:bg-zinc-800"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 my-1 custom-scrollbar">
          {/* Copy Mode Selector */}
          {!isCompleted && !copyProgress.isCopying && (
            <div className="space-y-2">
              <label className="text-xs font-mono font-semibold text-zinc-300 uppercase tracking-wide">
                Mode Copy File Editing:
              </label>
              <div className="grid grid-cols-1 gap-2">
                <label
                  className={`p-3 rounded-xl border text-xs font-mono cursor-pointer transition-all flex items-start gap-3 ${
                    copyMode === "raw-preferred"
                      ? "bg-emerald-950/30 border-emerald-500 text-white"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="copyMode"
                    value="raw-preferred"
                    checked={copyMode === "raw-preferred"}
                    onChange={() => setCopyMode("raw-preferred")}
                    className="mt-0.5 accent-emerald-500 shrink-0"
                  />
                  <div>
                    <div className="font-bold text-emerald-400">
                      RAW Only (Fallback to JPG if RAW missing) ★ Recommended
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                      Prioritas copy file RAW. Jika RAW tidak ada untuk pilihan client, otomatis mengambil file JPG agar pilihan client tidak terlewat.
                    </div>
                  </div>
                </label>

                <label
                  className={`p-3 rounded-xl border text-xs font-mono cursor-pointer transition-all flex items-start gap-3 ${
                    copyMode === "all"
                      ? "bg-emerald-950/30 border-emerald-500 text-white"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="copyMode"
                    value="all"
                    checked={copyMode === "all"}
                    onChange={() => setCopyMode("all")}
                    className="mt-0.5 accent-emerald-500 shrink-0"
                  />
                  <div>
                    <div className="font-bold text-white">RAW + JPG (Semua File)</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                      Copy kedua pasangan file (RAW & JPG) yang cocok ke folder _EDIT.
                    </div>
                  </div>
                </label>

                <label
                  className={`p-3 rounded-xl border text-xs font-mono cursor-pointer transition-all flex items-start gap-3 ${
                    copyMode === "raw-only"
                      ? "bg-emerald-950/30 border-emerald-500 text-white"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="copyMode"
                    value="raw-only"
                    checked={copyMode === "raw-only"}
                    onChange={() => setCopyMode("raw-only")}
                    className="mt-0.5 accent-emerald-500 shrink-0"
                  />
                  <div>
                    <div className="font-bold text-white">RAW Strict (Hanya RAW)</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                      Hanya copy file RAW yang ditemukan, abaikan file JPG.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Summary Details */}
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 space-y-2.5 text-xs font-mono">
            <div className="flex justify-between items-center text-zinc-300">
              <span>Client Selections:</span>
              <strong className="text-white">{matchedPhotos.length} photos</strong>
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span>Total Files to Copy:</span>
              <strong className="text-emerald-400">{targetFilesCount} files</strong>
            </div>
            <div className="flex justify-between items-center pl-3 text-zinc-400 border-l-2 border-amber-500/40">
              <span>RAW Files:</span>
              <span>{targetRawCount} RAW</span>
            </div>
            <div className="flex justify-between items-center pl-3 text-zinc-400 border-l-2 border-emerald-500/40">
              <span>JPG Files:</span>
              <span>{targetJpgCount} JPG</span>
            </div>
            <div className="flex justify-between items-center text-zinc-400 pt-2 border-t border-zinc-800">
              <span>Destination Folder:</span>
              <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                _EDIT /
              </span>
            </div>
          </div>

          {/* Safety Warning Note */}
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs font-mono flex items-start gap-2.5">
            <svg className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <strong>SAFETY PROMISE:</strong> File original Anda aman di disk. Sistem akan melakukan <strong>COPY</strong>, tidak pernah MOVE atau MENGHAPUS file asli.
            </div>
          </div>

          {/* Copy Progress Bar */}
          {copyProgress.isCopying && (
            <div className="space-y-2 font-mono text-xs p-3 rounded-xl bg-zinc-950 border border-emerald-500/30">
              <div className="flex justify-between text-zinc-300">
                <span className="text-emerald-400 font-bold animate-pulse">Copying files into _EDIT...</span>
                <span>
                  {copyProgress.copiedCount} / {copyProgress.totalCount}
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="h-full bg-emerald-500 transition-all duration-150"
                  style={{
                    width: `${(copyProgress.copiedCount / Math.max(1, copyProgress.totalCount)) * 100}%`,
                  }}
                />
              </div>
              {copyProgress.currentFilename && (
                <p className="text-[11px] text-zinc-500 truncate">
                  Current: {copyProgress.currentFilename}
                </p>
              )}
            </div>
          )}

          {/* Completion Message */}
          {isCompleted && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Editing Set Created Successfully!</span>
              </div>
              <p className="leading-relaxed">
                Successfully copied {copyProgress.copiedCount} files into the <strong>_EDIT</strong> folder. You can now open this folder in Lightroom, Capture One, or your preferred editing software.
              </p>
            </div>
          )}
        </div>

        {/* Sticky Footer Actions Bar */}
        <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-end gap-2.5 shrink-0 bg-zinc-900">
          {!copyProgress.isCopying && (
            <button
              type="button"
              onClick={handleDownloadManifest}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition-colors border border-zinc-700/60 mr-auto"
            >
              Download Manifest (.txt)
            </button>
          )}

          {!copyProgress.isCopying && !isCompleted && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-mono transition-colors border border-zinc-800"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!rootHandle || targetFilesCount === 0}
                onClick={handleStartCopying}
                className={`px-5 py-2 rounded-xl font-bold font-mono text-xs transition-all shadow-lg ${
                  !rootHandle || targetFilesCount === 0
                    ? "bg-zinc-800 text-zinc-500 border border-zinc-700/40 cursor-not-allowed"
                    : "bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-950/50"
                }`}
              >
                {rootHandle ? "Create Set & Copy Files" : "Folder Handle Unavailable"}
              </button>
            </>
          )}

          {isCompleted && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold font-mono text-xs"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
