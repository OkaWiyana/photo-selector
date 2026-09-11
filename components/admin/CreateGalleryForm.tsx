"use client";

import { useState } from "react";
import Link from "next/link";
import { createGalleryAction } from "@/app/admin/actions";
import { CreateGalleryResult } from "@/lib/types/gallery";

export function CreateGalleryForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreateGalleryResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Local form state for controlled inputs
  const [formData, setFormData] = useState({
    clientName: "",
    driveUrl: "",
    maxSelections: "10",
    whatsappNumber: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const data = new FormData();
    data.append("clientName", formData.clientName);
    data.append("driveUrl", formData.driveUrl);
    data.append("maxSelections", formData.maxSelections);
    data.append("whatsappNumber", formData.whatsappNumber);

    try {
      const res = await createGalleryAction(null, data);
      setResult(res);
    } catch {
      setResult({
        success: false,
        errors: { form: "An unexpected error occurred. Please try again." },
      });
    } finally {
      setLoading(false);
    }
  };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
    : typeof window !== "undefined"
    ? window.location.origin
    : "";

  const fullGalleryUrl = result?.galleryUrl
    ? `${siteUrl}${result.galleryUrl}`
    : "";

  const handleCopyLink = async () => {
    if (!fullGalleryUrl) return;
    try {
      await navigator.clipboard.writeText(fullGalleryUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
    }
  };

  const handleCreateAnother = () => {
    setResult(null);
    setFormData({
      clientName: "",
      driveUrl: "",
      maxSelections: "10",
      whatsappNumber: "",
    });
  };

  // If creation succeeded, show the Success & Share Card
  if (result?.success && result.galleryUrl) {
    return (
      <div className="w-full max-w-xl mx-auto bg-zinc-900 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl animate-in fade-in duration-200">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
              Gallery Created Successfully!
            </span>
            <h2 className="text-2xl font-bold text-white mt-1">
              Shareable Gallery Link Ready
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-md">
              Send this unique link to your client so they can select photos up to their limit.
            </p>
          </div>

          {/* Display Generated URL */}
          <div className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between gap-3 mt-2">
            <span className="truncate text-xs font-mono text-zinc-200 text-left select-all">
              {fullGalleryUrl}
            </span>

            <button
              type="button"
              onClick={handleCopyLink}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                copied
                  ? "bg-emerald-500 text-white"
                  : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white"
              }`}
            >
              {copied ? (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-4">
            <Link
              href={result.galleryUrl}
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-950/30"
            >
              <span>Open Gallery</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>

            <Link
              href={`/editor?gallery=${result.galleryId}`}
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-blue-950/30 font-mono"
            >
              <span>Open in Editor</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Link>

            <button
              type="button"
              onClick={handleCreateAnother}
              className="w-full sm:flex-1 inline-flex items-center justify-center px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium text-xs transition-all border border-zinc-700"
            >
              Create Another
            </button>
          </div>

        </div>
      </div>
    );
  }

  const errors = result?.errors;

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-xl mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col gap-6"
    >
      <div>
        <h2 className="text-xl font-bold text-white">Create New Gallery</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Configure a new client proofing gallery from a Google Drive folder.
        </p>
      </div>

      {/* Form Error Banner */}
      {errors?.form && (
        <div className="rounded-xl bg-red-950/60 border border-red-500/30 p-3.5 text-red-300 text-xs flex items-center gap-2">
          <svg className="h-4 w-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errors.form}</span>
        </div>
      )}

      {/* Client Name Input */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="clientName" className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
          Client Name <span className="text-emerald-400">*</span>
        </label>
        <input
          id="clientName"
          name="clientName"
          type="text"
          placeholder="e.g. Sarah & David Wedding"
          value={formData.clientName}
          onChange={handleChange}
          className={`w-full rounded-xl bg-zinc-950 border px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-all ${
            errors?.clientName
              ? "border-red-500/70 focus:border-red-500 focus:ring-1 focus:ring-red-500/50"
              : "border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
          }`}
        />
        {errors?.clientName && (
          <span className="text-xs text-red-400">{errors.clientName}</span>
        )}
      </div>

      {/* Google Drive Folder URL Input */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="driveUrl" className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
          Google Drive Folder URL <span className="text-emerald-400">*</span>
        </label>
        <input
          id="driveUrl"
          name="driveUrl"
          type="url"
          placeholder="https://drive.google.com/drive/folders/1A2B3C..."
          value={formData.driveUrl}
          onChange={handleChange}
          className={`w-full rounded-xl bg-zinc-950 border px-4 py-3 text-sm text-white placeholder-zinc-500 font-mono text-xs focus:outline-none transition-all ${
            errors?.driveUrl
              ? "border-red-500/70 focus:border-red-500 focus:ring-1 focus:ring-red-500/50"
              : "border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
          }`}
        />
        {errors?.driveUrl ? (
          <span className="text-xs text-red-400">{errors.driveUrl}</span>
        ) : (
          <span className="text-[11px] text-zinc-500 font-mono">
            Paste the shared Google Drive folder URL containing the client photo previews.
          </span>
        )}
      </div>

      {/* Maximum Selections & WhatsApp Number Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Maximum Photos */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="maxSelections" className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
            Max Photos Limit <span className="text-emerald-400">*</span>
          </label>
          <input
            id="maxSelections"
            name="maxSelections"
            type="number"
            min="1"
            max="500"
            placeholder="10"
            value={formData.maxSelections}
            onChange={handleChange}
            className={`w-full rounded-xl bg-zinc-950 border px-4 py-3 text-sm text-white placeholder-zinc-500 font-mono focus:outline-none transition-all ${
              errors?.maxSelections
                ? "border-red-500/70 focus:border-red-500 focus:ring-1 focus:ring-red-500/50"
                : "border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
            }`}
          />
          {errors?.maxSelections && (
            <span className="text-xs text-red-400">{errors.maxSelections}</span>
          )}
        </div>

        {/* WhatsApp Number */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="whatsappNumber" className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
            WhatsApp Number <span className="text-emerald-400">*</span>
          </label>
          <input
            id="whatsappNumber"
            name="whatsappNumber"
            type="tel"
            placeholder="e.g. 628123456789"
            value={formData.whatsappNumber}
            onChange={handleChange}
            className={`w-full rounded-xl bg-zinc-950 border px-4 py-3 text-sm text-white placeholder-zinc-500 font-mono focus:outline-none transition-all ${
              errors?.whatsappNumber
                ? "border-red-500/70 focus:border-red-500 focus:ring-1 focus:ring-red-500/50"
                : "border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
            }`}
          />
          {errors?.whatsappNumber && (
            <span className="text-xs text-red-400">{errors.whatsappNumber}</span>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all shadow-lg mt-2 ${
          loading
            ? "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed"
            : "bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-950/40 active:scale-[0.99]"
        }`}
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin text-zinc-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Creating Gallery...</span>
          </>
        ) : (
          <span>Create Gallery & Generate Link</span>
        )}
      </button>
    </form>
  );
}
