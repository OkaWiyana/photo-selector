import { Metadata } from "next";
import Link from "next/link";
import { getAllGalleriesWithSelections } from "@/lib/services/gallery-service";
import { DashboardTable } from "@/components/admin/DashboardTable";

export const metadata: Metadata = {
  title: "Client Selections Dashboard | Photographer Admin",
  description:
    "Hidden minimalist dashboard for reviewing published client galleries, selection statuses, and photo filenames.",
};

// Revalidate on every request so new client submissions reflect immediately
export const revalidate = 0;

export default async function AdminDashboardPage() {
  const galleries = await getAllGalleriesWithSelections();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Minimal Header */}
      <header className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-4 py-3.5 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Kembali ke Form Buat Gallery"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>
            <div>
              <h1 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                <span>Dashboard Projects</span>
              </h1>
            </div>
          </div>

          {/* Quick Nav Links */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors border border-zinc-800/80"
            >
              + Gallery Baru
            </Link>

            <Link
              href="/editor"
              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/20 transition-colors"
            >
              Editor Workspace
            </Link>
          </div>
        </div>
      </header>

      {/* Dashboard Body */}
      <main className="flex-1 mx-auto w-full max-w-6xl p-4 sm:p-6">
        <DashboardTable initialGalleries={galleries} />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-4 text-center text-[11px] text-zinc-600 font-mono">
        Photo Selector • Hidden Dashboard Route
      </footer>
    </div>
  );
}
