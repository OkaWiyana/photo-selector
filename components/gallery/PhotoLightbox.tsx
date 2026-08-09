"use client";

import { useEffect, useCallback } from "react";
import Image from "next/image";
import { Photo } from "@/lib/types/gallery";

interface PhotoLightboxProps {
  photos: Photo[];
  currentIndex: number | null;
  selectedIds: Set<string>;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
  onToggleSelect: (photo: Photo) => void;
}

export function PhotoLightbox({
  photos,
  currentIndex,
  selectedIds,
  onClose,
  onNavigate,
  onToggleSelect,
}: PhotoLightboxProps) {
  const isOpen = currentIndex !== null && currentIndex >= 0 && currentIndex < photos.length;
  const currentPhoto = isOpen ? photos[currentIndex] : null;
  const isSelected = currentPhoto ? selectedIds.has(currentPhoto.id) : false;

  const handlePrev = useCallback(() => {
    if (currentIndex !== null && currentIndex > 0) {
      onNavigate(currentIndex - 1);
    } else if (currentIndex === 0) {
      onNavigate(photos.length - 1); // Loop back to end
    }
  }, [currentIndex, photos.length, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex !== null && currentIndex < photos.length - 1) {
      onNavigate(currentIndex + 1);
    } else if (currentIndex === photos.length - 1) {
      onNavigate(0); // Loop back to start
    }
  }, [currentIndex, photos.length, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === " " && currentPhoto) {
        e.preventDefault();
        onToggleSelect(currentPhoto);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Prevent scrolling behind modal
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handlePrev, handleNext, onClose, currentPhoto, onToggleSelect]);

  if (!isOpen || !currentPhoto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-md text-white select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Lightbox Header Bar */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-zinc-950/80 border-b border-zinc-800/60 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-zinc-400">
            {currentIndex + 1} / {photos.length}
          </span>
          <span className="h-4 w-px bg-zinc-800 hidden sm:inline-block" />
          <h3 className="text-sm font-mono font-medium truncate max-w-[180px] sm:max-w-xs text-zinc-200">
            {currentPhoto.name}
          </h3>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          aria-label="Close preview"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main Image Stage */}
      <div
        className="relative flex-1 flex items-center justify-center p-4 min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Previous Button */}
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900/80 text-white border border-zinc-700/60 hover:bg-zinc-800 hover:scale-105 transition-all shadow-lg"
          aria-label="Previous photo"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Image Display */}
        <div className="relative w-full h-full max-w-5xl max-h-[75vh] flex items-center justify-center">
          <Image
            src={currentPhoto.src}
            alt={currentPhoto.name}
            fill
            className="object-contain transition-opacity duration-200"
            sizes="100vw"
            priority
          />
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={handleNext}
          className="absolute right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900/80 text-white border border-zinc-700/60 hover:bg-zinc-800 hover:scale-105 transition-all shadow-lg"
          aria-label="Next photo"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Lightbox Footer Action Bar */}
      <div
        className="flex items-center justify-between px-6 py-4 bg-zinc-950/90 border-t border-zinc-800/60 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-xs text-zinc-400 font-mono hidden sm:block">
          Use ← → keys to navigate • Esc to exit • Space to select
        </div>

        <button
          type="button"
          onClick={() => onToggleSelect(currentPhoto)}
          className={`ml-auto flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
            isSelected
              ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-950/40"
              : "bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700 hover:text-white"
          }`}
        >
          <svg
            className={`h-4 w-4 ${isSelected ? "stroke-[3]" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{isSelected ? "Selected" : "Select Photo"}</span>
        </button>
      </div>
    </div>
  );
}
