"use client";

import { useState, useCallback } from "react";
import { Gallery, Photo } from "@/lib/types/gallery";
import { GalleryHeader } from "./GalleryHeader";
import { PhotoCard } from "./PhotoCard";
import { PhotoLightbox } from "./PhotoLightbox";
import { FloatingActionBar } from "./FloatingActionBar";
import { useSharedSelections } from "@/lib/hooks/useSharedSelections";

interface GalleryContainerProps {
  gallery: Gallery;
}

export function GalleryContainer({ gallery }: GalleryContainerProps) {
  const {
    selectedIds,
    selectedPhotos,
    selectionCount,
    toggleSelection,
    isToggling,
    connectionStatus,
    lastError,
    isLoaded,
  } = useSharedSelections({
    galleryId: gallery.id,
    maxSelections: gallery.maxSelections,
  });

  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(
    null,
  );
  const [showLimitWarning, setShowLimitWarning] = useState<boolean>(false);

  // Derive the selected Photo[] objects from the current selectedIds
  const selectedPhotoObjects = gallery.photos.filter((p) =>
    selectedIds.has(p.id),
  );

  const handleToggleSelect = useCallback(
    async (photo: Photo) => {
      const result = await toggleSelection(photo.id, photo.name);

      if (result?.action === "limit_reached") {
        setShowLimitWarning(true);
        setTimeout(() => setShowLimitWarning(false), 4000);
      } else {
        setShowLimitWarning(false);
      }
    },
    [toggleSelection],
  );

  const handleOpenPreview = useCallback(
    (photo: Photo) => {
      const index = gallery.photos.findIndex((p) => p.id === photo.id);
      if (index !== -1) {
        setActiveLightboxIndex(index);
      }
    },
    [gallery.photos],
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Header Bar */}
      <GalleryHeader
        title={gallery.title}
        clientName={gallery.clientName}
        selectedCount={selectionCount}
        maxSelections={gallery.maxSelections}
        showLimitWarning={showLimitWarning}
        connectionStatus={connectionStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-6xl p-4 sm:p-6 pb-40 sm:pb-48">
        {/* Gallery Grid Sub-header */}
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-xs sm:text-sm text-zinc-400 font-mono">
            Tap a photo to select • Click expand icon for preview
          </p>
          <span className="text-xs text-zinc-500 font-mono">
            {gallery.photos.length} total photos
          </span>
        </div>

        {/* Error/Status Toast */}
        {lastError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-950/60 border border-red-500/30 p-3 text-red-200 text-xs sm:text-sm animate-in slide-in-from-top-2 duration-200">
            <svg
              className="h-4 w-4 text-red-400 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{lastError}</span>
          </div>
        )}

        {/* Loading skeleton while initial data loads */}
        {!isLoaded && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 text-zinc-400 text-sm">
              <svg
                className="h-5 w-5 animate-spin"
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
              <span>Loading selections...</span>
            </div>
          </div>
        )}

        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {gallery.photos.map((photo, index) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              index={index}
              isSelected={selectedIds.has(photo.id)}
              isDisabled={isToggling}
              onToggleSelect={handleToggleSelect}
              onOpenPreview={handleOpenPreview}
            />
          ))}
        </div>
      </main>

      {/* Lightbox Modal */}
      <PhotoLightbox
        photos={gallery.photos}
        currentIndex={activeLightboxIndex}
        selectedIds={selectedIds}
        onClose={() => setActiveLightboxIndex(null)}
        onNavigate={(newIndex) => setActiveLightboxIndex(newIndex)}
        onToggleSelect={handleToggleSelect}
      />

      {/* Floating Action Bar */}
      <FloatingActionBar
        galleryId={gallery.id}
        selectedPhotos={selectedPhotoObjects}
        selectedPhotoNames={selectedPhotos}
        maxSelections={gallery.maxSelections}
        whatsappNumber={gallery.whatsappNumber}
        clientName={gallery.clientName}
      />
    </div>
  );
}
