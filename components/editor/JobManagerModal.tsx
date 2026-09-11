"use client";

import { useState } from "react";
import { EditingJob } from "@/lib/types/editor";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface JobManagerModalProps {
  jobs: EditingJob[];
  currentJobId: string;
  onSelectJob: (job: EditingJob) => void;
  onCreateNewJob: (name: string) => void;
  onDeleteJob: (id: string) => void;
  onClose: () => void;
}

export function JobManagerModal({
  jobs,
  currentJobId,
  onSelectJob,
  onCreateNewJob,
  onDeleteJob,
  onClose,
}: JobManagerModalProps) {
  const [newJobName, setNewJobName] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);

  const deletingJob = jobs.find((j) => j.id === deletingJobId);

  const filteredJobs = jobs.filter((job) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = job.name.toLowerCase().includes(q);
    const clientMatch = job.clientName?.toLowerCase().includes(q);
    return nameMatch || Boolean(clientMatch);
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobName.trim()) return;
    onCreateNewJob(newJobName.trim());
    setNewJobName("");
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 text-zinc-100 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Saved Job Workspaces</h3>
                <p className="text-xs text-zinc-400">Cari, pilih, atau buat workspace baru</p>
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

          {/* Create New Job Form */}
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              type="text"
              value={newJobName}
              onChange={(e) => setNewJobName(e.target.value)}
              placeholder="New Job Name (e.g. Wedding Putu & Ayu)..."
              className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newJobName.trim()}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold font-mono text-xs disabled:opacity-50 transition-all shrink-0"
            >
              Create Job
            </button>
          </form>

          {/* Search Saved Jobs input */}
          {jobs.length > 0 && (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari job workspace..."
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none"
              />
              <svg
                className="h-4 w-4 text-zinc-500 absolute left-3 top-2.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          )}

          {/* Saved Jobs List */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
            <div className="text-xs font-mono text-zinc-400 mb-1 flex justify-between">
              <span>Saved Workspaces ({filteredJobs.length})</span>
              {jobs.length > 0 && <span>Total: {jobs.length}</span>}
            </div>
            {filteredJobs.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 font-mono bg-zinc-950 rounded-xl border border-zinc-800/60">
                {jobs.length === 0
                  ? "Belum ada job tersimpan. Buat baru di atas!"
                  : "Tidak ditemukan job yang sesuai pencarian."}
              </div>
            ) : (
              filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    job.id === currentJobId
                      ? "bg-emerald-950/20 border-emerald-500/50 text-white"
                      : "bg-zinc-950/80 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs font-mono truncate">{job.name}</span>
                      {job.id === currentJobId && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500 mt-0.5">
                      {job.clientSelections.length} selection{job.clientSelections.length === 1 ? "" : "s"} • {new Date(job.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {job.id !== currentJobId && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectJob(job);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono transition-colors"
                      >
                        Load
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeletingJobId(job.id)}
                      className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-950/40 text-zinc-500 hover:text-rose-400 transition-colors"
                      title="Delete Job"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Delete Job Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingJobId)}
        title="Hapus Workspace Job?"
        message={`Apakah Anda yakin ingin menghapus job workspace "${deletingJob?.name || ""}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Job"
        cancelText="Batal"
        variant="danger"
        onConfirm={() => {
          if (deletingJobId) {
            onDeleteJob(deletingJobId);
            setDeletingJobId(null);
          }
        }}
        onClose={() => setDeletingJobId(null)}
      />
    </>
  );
}
