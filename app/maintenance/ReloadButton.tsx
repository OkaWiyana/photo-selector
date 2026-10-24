"use client";

export default function ReloadButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="cursor-pointer w-full sm:w-auto px-5 py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 text-sm font-medium transition duration-150 active:scale-[0.98]"
    >
      Refresh
    </button>
  );
}
