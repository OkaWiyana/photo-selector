"use client";

import { useState, useCallback } from "react";
import {
  generateWhatsAppLink,
  formatWhatsAppMessage,
  formatCopy,
} from "@/lib/utils/whatsapp";
import { Photo } from "@/lib/types/gallery";

interface FloatingActionBarProps {
  galleryId?: string;
  selectedPhotos: Photo[];
  selectedPhotoNames?: Map<string, string>;
  maxSelections: number;
  whatsappNumber: string;
  clientName: string;
}

export function FloatingActionBar({
  galleryId,
  selectedPhotos,
  selectedPhotoNames,
  maxSelections,
  whatsappNumber,
  clientName,
}: FloatingActionBarProps) {
  const selectedCount = selectedPhotos.length;
  const isDisabled = selectedCount === 0;
  const [isSending, setIsSending] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  // Helper to fetch authoritative selections before taking action
  const getAuthoritativePhotos = useCallback(async (): Promise<Photo[]> => {
    let finalPhotos: Photo[] = selectedPhotos;

    if (galleryId) {
      try {
        const res = await fetch(
          `/api/selections/${encodeURIComponent(galleryId)}`,
        );
        if (res.ok) {
          const data = await res.json();
          const serverSelections = data.selections as {
            photo_id: string;
            photo_name: string;
          }[];

          if (serverSelections && serverSelections.length > 0) {
            finalPhotos = serverSelections.map((sel) => {
              const matchedPhoto = selectedPhotos.find(
                (p) => p.id === sel.photo_id,
              );
              return (
                matchedPhoto || {
                  id: sel.photo_id,
                  name: sel.photo_name,
                  src: "",
                }
              );
            });
          }
        }
      } catch {
        console.warn(
          "[FloatingActionBar] Failed to fetch latest selections, using local state",
        );
      }
    }

    return finalPhotos;
  }, [galleryId, selectedPhotos]);

  const handleSendSelection = async () => {
    if (isDisabled || isSending) return;

    setIsSending(true);
    try {
      const finalPhotos = await getAuthoritativePhotos();
      const url = generateWhatsAppLink({
        phone: whatsappNumber,
        clientName,
        selectedPhotos: finalPhotos,
      });

      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyList = async () => {
    if (isDisabled || isCopying) return;

    setIsCopying(true);
    try {
      const finalPhotos = await getAuthoritativePhotos();
      const messageText = formatCopy(finalPhotos);

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(messageText);
      } else {
        // Fallback for non-https / older webviews
        const textArea = document.createElement("textarea");
        textArea.value = messageText;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("[FloatingActionBar] Failed to copy:", err);
    } finally {
      setIsCopying(false);
    }
  };

  // Build the names list for display
  const selectedNamesList: string[] = [];
  if (selectedPhotoNames && selectedPhotoNames.size > 0) {
    for (const [, name] of selectedPhotoNames) {
      selectedNamesList.push(name);
    }
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/80 px-3.5 py-2.5 sm:px-6 sm:py-3.5 shadow-2xl">
      <div className="mx-auto max-w-6xl flex items-center justify-between gap-3">
        {/* Left: Compact Selection Counter & Filename preview */}
        <div className="flex flex-col min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] sm:text-xs text-zinc-400 font-medium">
              Selection:
            </span>
            <span className="text-xs sm:text-sm font-semibold text-white">
              {selectedCount === 0 ? (
                <span className="text-zinc-500 font-normal">
                  No photos selected
                </span>
              ) : (
                <span className="text-emerald-400 font-mono">
                  {selectedCount}{" "}
                  <span className="text-zinc-400 font-sans font-normal text-xs">
                    / {maxSelections}
                  </span>
                </span>
              )}
            </span>
          </div>

          {/* Subtitle / Filenames peek */}
          {selectedNamesList.length > 0 ? (
            <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[120px] sm:max-w-[280px] mt-0.5">
              {selectedNamesList.slice(0, 2).join(", ")}
              {selectedNamesList.length > 2
                ? ` +${selectedNamesList.length - 2}`
                : ""}
            </span>
          ) : (
            <span className="text-[10px] text-zinc-500 hidden sm:inline">
              Select photos you want to edit
            </span>
          )}
        </div>

        {/* Right: Action Buttons Group (Clean on mobile) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Secondary Action: Copy List Button */}
          <button
            type="button"
            onClick={handleCopyList}
            disabled={isDisabled || isCopying}
            title={copied ? "Tersalin ke clipboard!" : "Salin daftar pilihan"}
            aria-label="Salin daftar pilihan"
            className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm font-medium transition-all ${
              isDisabled || isCopying
                ? "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                : copied
                  ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 shadow-sm"
                  : "bg-zinc-900 text-zinc-300 border border-zinc-700/80 hover:bg-zinc-800 hover:text-white active:scale-95"
            }`}
          >
            {isCopying ? (
              <svg
                className="h-4 w-4 animate-spin text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : copied ? (
              <svg
                className="h-4 w-4 text-emerald-400 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="h-4 w-4 text-zinc-400 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}

            <span className={copied ? "text-emerald-300 font-semibold" : ""}>
              {copied ? "Copied!" : "Copy"}
            </span>
          </button>

          {/* Primary Action: WhatsApp Button */}
          <button
            type="button"
            onClick={handleSendSelection}
            disabled={isDisabled || isSending}
            aria-label="Kirim pilihan via WhatsApp"
            className={`flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all shadow-md ${
              isDisabled || isSending
                ? "bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed"
                : "bg-emerald-500 text-white hover:bg-emerald-400 active:scale-[0.98] shadow-emerald-950/40"
            }`}
          >
            {isSending ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span className="text-xs sm:text-sm">Preparing...</span>
              </>
            ) : (
              <>
                {/* WhatsApp Icon */}
                <svg
                  className="h-4 w-4 fill-current shrink-0"
                  viewBox="0 0 24 24"
                >
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                <span className="hidden sm:inline">Send Selection</span>
                <span className="sm:hidden">Send Selection</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
