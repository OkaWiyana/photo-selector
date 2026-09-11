"use client";

import { useState, useEffect } from "react";
import { fetchGalleriesWithSelectionsAction } from "@/app/admin/actions";

interface GallerySelectionSummary {
  id: string;
  clientName: string;
  maxSelections: number;
  createdAt?: string;
  selectedFilenames: string[];
}


interface SupabaseGalleryPickerModalProps {
  onSelectGallery: (data: {
    galleryId: string;
    clientName: string;
    selectedFilenames: string[];
  }) => void;
  onClose: () => void;
}

export function SupabaseGalleryPickerModal({
  onSelectGallery,
  onClose,
}: SupabaseGalleryPickerModalProps) {
  const [galleries, setGalleries] = useState<GallerySelectionSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetchGalleriesWithSelectionsAction();
        setGalleries(res);
      } catch (err) {
        console.error("Failed loading galleries from Supabase:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredGalleries = galleries.filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return g.clientName.toLowerCase().includes(q) || g.id.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 text-zinc-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Import Client Gallery</h3>
              <p className="text-xs text-zinc-400">Pilih galeri client dari Supabase untuk di-import</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama client atau ID galeri..."
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-zinc-200 font-mono focus:outline-none"
          />
          <svg
            className="h-4 w-4 text-zinc-500 absolute left-3 top-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* List */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center text-xs font-mono text-blue-400 animate-pulse">
              Memuat galeri client dari Supabase...
            </div>
          ) : filteredGalleries.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-500 font-mono bg-zinc-950 rounded-xl border border-zinc-800/60">
              Tidak ada galeri yang ditemukan di Supabase.
            </div>
          ) : (
            filteredGalleries.map((item) => {
              const hasSelections = item.selectedFilenames.length > 0;
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs font-mono text-white truncate">
                      {item.clientName}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-mono text-zinc-400">
                        {hasSelections ? (
                          <strong className="text-emerald-400">
                            {item.selectedFilenames.length} photo{item.selectedFilenames.length === 1 ? "" : "s"} selected
                          </strong>
                        ) : (
                          <span className="text-zinc-500">Belum ada pilihan</span>
                        )}
                      </span>
                      {item.createdAt && (
                        <span className="text-[10px] text-zinc-600 font-mono">
                          • {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!hasSelections}
                    onClick={() => {
                      onSelectGallery({
                        galleryId: item.id,
                        clientName: item.clientName,
                        selectedFilenames: item.selectedFilenames,
                      });
                      onClose();
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shrink-0 ${
                      hasSelections
                        ? "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-950/30"
                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/40"
                    }`}
                  >
                    {hasSelections ? "Import Selection" : "No Selection"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
