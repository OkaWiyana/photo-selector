"use client";

import { useState } from "react";
import { Gallery, Photo } from "@/lib/types/gallery";
import { GalleryHeader } from "./GalleryHeader";
import { PhotoCard } from "./PhotoCard";
import { PhotoLightbox } from "./PhotoLightbox";
import { FloatingActionBar } from "./FloatingActionBar";

interface GalleryContainerProps {
  gallery: Gallery;
}

export function GalleryContainer({ gallery }: GalleryContainerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [showLimitWarning, setShowLimitWarning] = useState<boolean>(false);

  const selectedPhotos = gallery.photos.filter((p) => selectedIds.has(p.id));

  const handleToggleSelect = (photo: Photo) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(photo.id)) {
        next.delete(photo.id);
        setShowLimitWarning(false);
      } else {
        if (next.size >= gallery.maxSelections) {
          setShowLimitWarning(true);
          // Hide toast warning automatically after 4 seconds
          setTimeout(() => setShowLimitWarning(false), 4000);
          return prev;
        }
        next.add(photo.id);
        setShowLimitWarning(false);
      }
      return next;
    });
  };

  const handleOpenPreview = (photo: Photo) => {
    const index = gallery.photos.findIndex((p) => p.id === photo.id);
    if (index !== -1) {
      setActiveLightboxIndex(index);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Header Bar */}
      <GalleryHeader
        title={gallery.title}
        clientName={gallery.clientName}
        selectedCount={selectedIds.size}
        maxSelections={gallery.maxSelections}
        showLimitWarning={showLimitWarning}
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

        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {gallery.photos.map((photo, index) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              index={index}
              isSelected={selectedIds.has(photo.id)}
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
        selectedPhotos={selectedPhotos}
        maxSelections={gallery.maxSelections}
        whatsappNumber={gallery.whatsappNumber}
        clientName={gallery.clientName}
      />

    </div>
  );
}
