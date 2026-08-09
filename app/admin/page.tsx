import { Metadata } from "next";
import Link from "next/link";
import { CreateGalleryForm } from "@/components/admin/CreateGalleryForm";

export const metadata: Metadata = {
  title: "Create Gallery | Photographer Admin",
  description: "Configure a new client photo proofing gallery from a Google Drive folder.",
};

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Admin Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-zinc-400 hover:text-white text-xs font-mono transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Photographer Admin
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 mx-auto w-full max-w-4xl p-4 sm:p-8 flex flex-col items-center justify-center">
        <CreateGalleryForm />
      </main>

      <footer className="text-center text-xs text-zinc-600 font-mono py-6">
        Photo Selector • Photographer Admin Interface
      </footer>
    </div>
  );
}
