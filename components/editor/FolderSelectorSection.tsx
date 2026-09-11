"use client";

import { useState, useRef, ChangeEvent } from "react";
import { PhotoFile, FolderScanProgress } from "@/lib/types/editor";
import {
  isFileSystemAccessSupported,
  scanDirectoryHandle,
  scanFileList,
} from "@/lib/services/editor-file-scanner";

interface FolderSelectorSectionProps {
  scannedFiles: PhotoFile[];
  scannedFolderName?: string;
  onFilesScanned: (
    files: PhotoFile[],
    folderName: string,
    dirHandle?: FileSystemDirectoryHandle
  ) => void;
  rawExtensions: string[];
  onUpdateRawExtensions: (exts: string[]) => void;
}

export function FolderSelectorSection({
  scannedFiles,
  scannedFolderName,
  onFilesScanned,
  rawExtensions,
  onUpdateRawExtensions,
}: FolderSelectorSectionProps) {
  const [scanProgress, setScanProgress] = useState<FolderScanProgress>({
    scannedCount: 0,
    isScanning: false,
  });
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [rawExtInput, setRawExtInput] = useState<string>(rawExtensions.join(", "));

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasNativeApi = isFileSystemAccessSupported();

  const handleSelectFolderNative = async () => {
    if (!hasNativeApi) {
      fileInputRef.current?.click();
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handle = await (window as any).showDirectoryPicker();
      if (!handle) return;

      setScanProgress({ scannedCount: 0, isScanning: true, currentFolder: handle.name });

      const result = await scanDirectoryHandle(handle, (prog) => setScanProgress(prog));

      onFilesScanned(result.files, result.folderName, result.dirHandle);
      setScanProgress({ scannedCount: result.files.length, isScanning: false });
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Error picking directory:", err);
      }
      setScanProgress({ scannedCount: 0, isScanning: false });
    }
  };

  const handleFallbackInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setScanProgress({ scannedCount: 0, isScanning: true, totalEstimated: files.length });

    const result = await scanFileList(files, (prog) => setScanProgress(prog));

    onFilesScanned(result.files, result.folderName);
    setScanProgress({ scannedCount: result.files.length, isScanning: false });
  };

  const handleSaveRawExts = () => {
    const exts = rawExtInput
      .split(/[,;\s]+/)
      .map((e) => e.trim().toLowerCase().replace(/^\./, ""))
      .filter(Boolean);

    if (exts.length > 0) {
      onUpdateRawExtensions(exts);
    }
    setShowConfigModal(false);
  };

  return (
    <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-5 sm:p-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left info */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Select Local Photo Folder
              {scannedFolderName && (
                <span className="text-xs font-normal text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2.5 py-0.5 rounded-full font-mono">
                  {scannedFolderName}
                </span>
              )}
            </h2>
            <p className="text-xs text-zinc-400">
              Browser reads file names & extensions directly on your computer (No uploads)
            </p>
          </div>
        </div>

        {/* Right buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRawExtInput(rawExtensions.join(", "));
              setShowConfigModal(true);
            }}
            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition-colors border border-zinc-700/60 flex items-center gap-1.5"
            title="Configure RAW extensions"
          >
            <svg className="h-3.5 w-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>RAW Config</span>
          </button>

          <button
            type="button"
            onClick={handleSelectFolderNative}
            disabled={scanProgress.isScanning}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-semibold text-xs transition-all shadow-md shadow-blue-950/40 flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Select Photo Folder</span>
          </button>

          {/* Hidden input for fallback */}
          <input
            ref={fileInputRef}
            type="file"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...({ webkitdirectory: "", directory: "" } as any)}
            onChange={handleFallbackInputChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Browser Fallback Banner Warning if native API unsupported */}
      {!hasNativeApi && (
        <div className="mt-4 p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-300 text-xs font-mono flex items-start gap-2.5">
          <svg className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <strong>Browser Note:</strong> Browser Anda tidak mendukung akses folder langsung (File System Access API). Gunakan Chrome/Edge desktop untuk fitur copy otomatis, atau gunakan selector folder biasa.
          </div>
        </div>
      )}

      {/* Progress / Scan Results Indicator */}
      {scanProgress.isScanning ? (
        <div className="mt-4 p-4 rounded-xl bg-zinc-950 border border-blue-500/30 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-blue-400 font-semibold animate-pulse">Scanning folder...</span>
            <span className="text-zinc-400">
              {scanProgress.scannedCount.toLocaleString()} {scanProgress.totalEstimated ? `/ ${scanProgress.totalEstimated.toLocaleString()}` : ""} files scanned
            </span>
          </div>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full animate-pulse w-full" />
          </div>
        </div>
      ) : (
        scannedFiles.length > 0 && (
          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>
              Total local files read: <strong className="text-zinc-200">{scannedFiles.length.toLocaleString()}</strong>
            </span>
            <span>
              Supported RAW: <span className="text-amber-400">{rawExtensions.join(", ").toUpperCase()}</span>
            </span>
          </div>
        )
      )}

      {/* RAW Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-zinc-100">
            <h3 className="text-base font-bold text-white">Configurable RAW Extensions</h3>
            <p className="text-xs text-zinc-400">
              Specify supported RAW file extensions separated by commas (e.g. CR3, CR2, NEF, ARW, DNG, RAF):
            </p>
            <textarea
              rows={3}
              value={rawExtInput}
              onChange={(e) => setRawExtInput(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl p-3 text-xs text-amber-300 font-mono focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRawExts}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs font-mono"
              >
                Save Extensions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
