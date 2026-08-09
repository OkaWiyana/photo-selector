"use client";

import { useState } from "react";
import Image from "next/image";
import { Photo } from "@/lib/types/gallery";

interface PhotoCardProps {
  photo: Photo;
  isSelected: boolean;
  onToggleSelect: (photo: Photo) => void;
  onOpenPreview: (photo: Photo) => void;
  index: number;
}

export function PhotoCard({
  photo,
  isSelected,
  onToggleSelect,
  onOpenPreview,
  index,
}: PhotoCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // SVG placeholder when image link fails to load
  const fallbackSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%2327272a"/><text x="50%" y="50%" fill="%23a1a1aa" font-family="sans-serif" font-size="16" text-anchor="middle" dominant-baseline="middle">${encodeURIComponent(
    photo.name
  )}</text></svg>`;

  return (
    <div
      style={{ position: "relative" }}
      className={`group relative overflow-hidden rounded-xl bg-zinc-900 border transition-all duration-200 select-none ${
        isSelected
          ? "border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-950/20"
          : "border-zinc-800/80 hover:border-zinc-700"
      }`}
    >
      {/* Aspect Ratio Container (4:3) */}
      <div
        style={{ position: "relative" }}
        className="relative w-full pt-[75%] cursor-pointer overflow-hidden bg-zinc-900"
        onClick={() => onToggleSelect(photo)}
      >
        {/* Image element */}
        <Image
          src={imageError ? fallbackSvg : photo.src}
          alt={photo.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
            isLoaded ? "opacity-100" : "opacity-0"
          } ${isSelected ? "brightness-[0.9]" : ""}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setImageError(true)}
          priority={index < 4}
        />

        {/* Skeleton pulse while loading */}
        {!isLoaded && !imageError && (
          <div className="absolute inset-0 animate-pulse bg-zinc-800" />
        )}

        {/* Selected Dark Overlay Tint */}
        {isSelected && (
          <div className="absolute inset-0 bg-emerald-950/20 pointer-events-none" />
        )}

        {/* Selection Toggle Badge (Top Right) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(photo);
          }}
          className={`absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 ${
            isSelected
              ? "bg-emerald-500 text-white shadow-md scale-100"
              : "bg-black/40 text-white/70 backdrop-blur-md border border-white/20 hover:bg-black/60 hover:text-white"
          }`}
          aria-label={isSelected ? `Deselect ${photo.name}` : `Select ${photo.name}`}
        >
          {isSelected ? (
            <svg
              className="h-4 w-4 stroke-[3]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <div className="h-2 w-2 rounded-full bg-white/60" />
          )}
        </button>

        {/* Zoom / Preview Trigger Button (Top Left) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenPreview(photo);
          }}
          className="absolute top-2.5 left-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white/80 backdrop-blur-md border border-white/20 opacity-90 transition-all hover:bg-black/70 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
          aria-label={`Preview ${photo.name}`}
          title="Preview photo"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
            />
          </svg>
        </button>

        {/* Bottom Filename Overlay */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5 pt-6 text-left pointer-events-none">
          <p className="truncate text-xs font-mono tracking-tight text-white/90">
            {photo.name}
          </p>
        </div>
      </div>
    </div>
  );
}
