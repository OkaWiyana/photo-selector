"use client";

import { useState, ChangeEvent } from "react";
import { ClientSelection } from "@/lib/types/editor";
import { parseClientSelectionText } from "@/lib/utils/editor";

interface ImportSelectionSectionProps {
  selections: ClientSelection[];
  onUpdateSelections: (selections: ClientSelection[], rawText?: string) => void;
  galleryInfo?: { clientName?: string; title?: string } | null;
}

export function ImportSelectionSection({
  selections,
  onUpdateSelections,
  galleryInfo,
}: ImportSelectionSectionProps) {
  const [inputText, setInputText] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const handleTextChange = (text: string) => {
    setInputText(text);
    const parsed = parseClientSelectionText(text);
    onUpdateSelections(parsed, text);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputText(content);
        const parsed = parseClientSelectionText(content);
        onUpdateSelections(parsed, content);
      }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    setInputText("");
    onUpdateSelections([]);
  };

  return (
    <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-5 sm:p-6 transition-all">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Import Client Selection
              {galleryInfo?.clientName && (
                <span className="text-xs font-normal text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full font-mono">
                  {galleryInfo.clientName}
                </span>
              )}
            </h2>
            <p className="text-xs text-zinc-400">
              Paste filenames, WhatsApp text, or upload a .txt file
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Selected Stats Badge */}
          <div className="text-right">
            <div className="text-xs text-zinc-400 font-mono">Selected by Client</div>
            <div className="text-sm font-extrabold text-emerald-400 font-mono">
              {selections.length} {selections.length === 1 ? "photo" : "photos"}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <svg
              className={`h-4 w-4 transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Input Panel */}
      {isExpanded && (
        <div className="mt-4 flex flex-col gap-3">
          <textarea
            rows={4}
            value={inputText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={`Paste filenames or WhatsApp submission here, e.g.:

IMG_1234.JPG
IMG_1240.JPG
IMG_1251.JPG
IMG_1288.JPG`}
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl p-3.5 text-xs text-zinc-200 font-mono placeholder-zinc-600 focus:outline-none transition-colors leading-relaxed"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left action buttons */}
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-mono cursor-pointer transition-colors border border-zinc-700/60">
                <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Upload .txt File</span>
                <input
                  type="file"
                  accept=".txt,.text,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {inputText && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-mono border border-zinc-800 transition-colors"
                >
                  Clear Input
                </button>
              )}
            </div>

            {/* Helper tips */}
            <span className="text-[11px] text-zinc-500 font-mono">
              Auto-parses lines, strips WhatsApp text & deduplicates
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
