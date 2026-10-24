import type { Metadata } from "next";
import ReloadButton from "./ReloadButton";

export const metadata: Metadata = {
  title: "System Under Maintenance — Kala Archives",
  description:
    "We’re currently performing some maintenance to make things even better. We’ll be back online shortly.",
};

export default function MaintenancePage() {
  const customMessage = process.env.NEXT_PUBLIC_MAINTENANCE_MESSAGE;

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-[#09090b] text-[#fafafa] relative overflow-hidden">
      {/* Background ambient glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-120 h-120 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"
      />

      <div className="relative max-w-md w-full text-center flex flex-col items-center space-y-6">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-medium tracking-wide">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          Under Maintenance
        </div>

        {/* Heading & Details */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            We’ll Be Right Back
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            {customMessage ||
              "We’re currently performing some maintenance to make things even better. We’ll be back online shortly."}
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2 w-full flex flex-col sm:flex-row gap-3 justify-center items-center">
          <ReloadButton />
        </div>

        {/* Footer info */}
        <p className="text-xs text-zinc-500 pt-4">
          Kala Archives &bull; Thank you for your patience
        </p>
      </div>
    </main>
  );
}
