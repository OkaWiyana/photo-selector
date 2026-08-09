"use client";

interface GalleryHeaderProps {
  title: string;
  clientName: string;
  selectedCount: number;
  maxSelections: number;
  showLimitWarning: boolean;
}

export function GalleryHeader({
  title,
  clientName,
  selectedCount,
  maxSelections,
  showLimitWarning,
}: GalleryHeaderProps) {
  const percentage = Math.min(100, Math.round((selectedCount / maxSelections) * 100));
  const isLimitReached = selectedCount >= maxSelections;

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 transition-colors">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Gallery Info */}
          <div>
            <div className="flex items-center gap-2 text-xs font-medium tracking-wide uppercase text-emerald-400">
              <span>Client Proofing</span>
              <span>•</span>
              <span className="text-zinc-400">{clientName}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
              {title}
            </h1>
          </div>

          {/* Selection Stats */}
          <div className="flex flex-col items-start sm:items-end gap-1.5 min-w-[200px]">
            <div className="flex items-center justify-between w-full text-sm">
              <span className="text-zinc-400 font-medium">Selected Photos</span>
              <span
                className={`font-mono font-bold px-2.5 py-0.5 rounded-md text-sm ${
                  isLimitReached
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}
              >
                {selectedCount} / {maxSelections}
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isLimitReached ? "bg-amber-400" : "bg-emerald-500"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Selection Limit Reached Warning Toast / Banner */}
        {showLimitWarning && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-amber-950/70 border border-amber-500/40 p-3 text-amber-200 text-xs sm:text-sm animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-amber-400 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>
                Maximum limit of <strong>{maxSelections} photos</strong> reached. Deselect a photo to choose a different one.
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
