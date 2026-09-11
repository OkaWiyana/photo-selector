import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Photo Selector — Client Proofing Made Simple",
  description: "A lightweight photo selection and proofing web app for photographers.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 selection:bg-emerald-500 selection:text-white">
      <main className="max-w-2xl w-full text-center flex flex-col items-center gap-8 py-12">
        {/* Brand Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono font-medium text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Photo Proofing Gallery App
        </div>

        {/* Title & Tagline */}
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            Photo Selector
          </h1>
          <p className="text-zinc-400 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
            Eliminate the hassle of asking clients to manually type photo filenames from Google Drive.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xl pt-2">
          <Link
            href="/admin"
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-950/40"
          >
            <span>Create Gallery</span>
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
                d="M12 4v16m8-8H4"
              />
            </svg>
          </Link>

          <Link
            href="/editor"
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-semibold text-sm transition-all shadow-lg shadow-blue-950/40 font-mono"
          >
            <span>Editor Workspace</span>
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </Link>

          <Link
            href="/gallery/demo"
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium text-sm transition-all border border-zinc-800"
          >
            <span>Demo Gallery</span>
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
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
        </div>


        {/* Workflow Steps Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-6 text-left">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <span className="text-emerald-400 font-mono text-xs font-bold">01. CONFIGURE</span>
            <h3 className="text-sm font-semibold text-white mt-1">Create Gallery</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-normal">
              Paste your Google Drive folder URL and set client selection limits in /admin.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <span className="text-emerald-400 font-mono text-xs font-bold">02. SHARE</span>
            <h3 className="text-sm font-semibold text-white mt-1">Send Unique Link</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-normal">
              Clients open their gallery link to select photos with live limit enforcement.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <span className="text-emerald-400 font-mono text-xs font-bold">03. RECEIVE</span>
            <h3 className="text-sm font-semibold text-white mt-1">WhatsApp Submission</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-normal">
              Receive chosen photo filenames directly in WhatsApp ready for editing.
            </p>
          </div>
        </div>
      </main>

      <footer className="text-xs text-zinc-600 font-mono mt-auto py-6">
        Photo Selector • Photographer Admin & Proofing App
      </footer>
    </div>
  );
}
