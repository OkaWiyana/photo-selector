"use client";

import Link from "next/link";

interface GalleryErrorStateProps {
  type: "NOT_FOUND" | "INACCESSIBLE_FOLDER" | "NO_IMAGES_FOUND" | "MISSING_CREDENTIALS" | "API_ERROR";
  message?: string;
  serviceAccountEmail?: string;
}

export function GalleryErrorState({
  type,
  message,
  serviceAccountEmail = process.env.NEXT_PUBLIC_SERVICE_ACCOUNT_EMAIL || "photo-selector@...",
}: GalleryErrorStateProps) {
  const getErrorContent = () => {
    switch (type) {
      case "NOT_FOUND":
        return {
          title: "Gallery Not Found",
          description: "The requested client gallery link does not exist or has expired.",
          actionText: "Return to Home",
          actionUrl: "/",
        };
      case "INACCESSIBLE_FOLDER":
        return {
          title: "Google Drive Folder Inaccessible",
          description:
            message ||
            "The Google Drive folder cannot be accessed. Make sure the folder is set to 'Anyone with the link can view' or shared with the Service Account email.",
          actionText: "Back to Admin",
          actionUrl: "/admin",
        };
      case "NO_IMAGES_FOUND":
        return {
          title: "No Image Files Found",
          description:
            "This Google Drive folder does not contain any supported image files (JPG, PNG, WEBP, etc.).",
          actionText: "Back to Admin",
          actionUrl: "/admin",
        };
      case "MISSING_CREDENTIALS":
        return {
          title: "Server Configuration Required",
          description:
            "Google Drive API credentials (GOOGLE_SERVICE_ACCOUNT_EMAIL & GOOGLE_PRIVATE_KEY) are not set in the server environment variables.",
          actionText: "Back to Admin",
          actionUrl: "/admin",
        };
      default:
        return {
          title: "Failed to Load Gallery",
          description: message || "An error occurred while connecting to Google Drive API.",
          actionText: "Try Again",
          actionUrl: "#",
        };
    }
  };

  const content = getErrorContent();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-4 shadow-2xl">
        <div className="h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-white mt-1">{content.title}</h2>
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{content.description}</p>

        {type === "INACCESSIBLE_FOLDER" && serviceAccountEmail && (
          <div className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-300 text-left mt-2">
            <span className="text-zinc-500 block mb-1">Service Account Email:</span>
            <code className="text-emerald-400 select-all break-all">{serviceAccountEmail}</code>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 w-full mt-4">
          <Link
            href={content.actionUrl}
            className="w-full inline-flex items-center justify-center px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-medium transition-all border border-zinc-700"
          >
            {content.actionText}
          </Link>
        </div>
      </div>
    </div>
  );
}
