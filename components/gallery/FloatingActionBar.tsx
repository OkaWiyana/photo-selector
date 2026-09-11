"use client";

import { generateWhatsAppLink } from "@/lib/utils/whatsapp";
import { Photo } from "@/lib/types/gallery";
import { saveGallerySelectionAction } from "@/app/admin/actions";

interface FloatingActionBarProps {
  galleryId?: string;
  selectedPhotos: Photo[];
  maxSelections: number;
  whatsappNumber: string;
  clientName: string;
}

export function FloatingActionBar({
  galleryId,
  selectedPhotos,
  maxSelections,
  whatsappNumber,
  clientName,
}: FloatingActionBarProps) {
  const selectedCount = selectedPhotos.length;
  const isDisabled = selectedCount === 0;

  const handleSendSelection = () => {
    if (isDisabled) return;

    // Asynchronously persist client selections if galleryId is available
    if (galleryId) {
      const selectedNames = selectedPhotos.map((p) => p.name);
      saveGallerySelectionAction(galleryId, selectedNames).catch(() => {});
    }

    const url = generateWhatsAppLink({
      phone: whatsappNumber,
      clientName,
      selectedPhotos,
    });

    window.open(url, "_blank", "noopener,noreferrer");
  };


  return (
    <div className="fixed bottom-0 inset-x-0 z-30 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800/80 p-4 sm:px-6">
      <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
        {/* Selection status message */}
        <div className="flex flex-col">
          <span className="text-xs text-zinc-400">Selection Summary</span>
          <span className="text-sm font-semibold text-white">
            {selectedCount === 0 ? (
              <span className="text-zinc-500 font-normal">No photos selected yet</span>
            ) : (
              <span>
                {selectedCount} of {maxSelections} photo{selectedCount > 1 ? "s" : ""} selected
              </span>
            )}
          </span>
        </div>

        {/* WhatsApp Submit Button */}
        <button
          type="button"
          onClick={handleSendSelection}
          disabled={isDisabled}
          className={`flex items-center justify-center gap-2.5 rounded-xl px-6 py-3 text-sm font-semibold transition-all shadow-lg ${
            isDisabled
              ? "bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed"
              : "bg-emerald-500 text-white hover:bg-emerald-400 active:scale-[0.98] shadow-emerald-950/40"
          }`}
        >
          {/* WhatsApp Icon */}
          <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
          <span>Send Selection</span>
        </button>
      </div>
    </div>
  );
}
