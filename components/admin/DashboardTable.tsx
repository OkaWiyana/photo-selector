"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { GallerySelectionSummary } from "@/lib/services/gallery-service";
import {
  fetchGalleriesWithSelectionsAction,
  updateGalleryAction,
  deleteGalleryAction,
} from "@/app/admin/actions";
import {
  formatClientInvitationMessage,
  generateClientWhatsAppLink,
} from "@/lib/utils/whatsapp";

interface DashboardTableProps {
  initialGalleries: GallerySelectionSummary[];
}

interface ToastNotice {
  message: string;
  type: "success" | "error";
}

export function DashboardTable({ initialGalleries }: DashboardTableProps) {
  const [galleries, setGalleries] =
    useState<GallerySelectionSummary[]>(initialGalleries);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "completed" | "pending"
  >("all");
  const [isPending, startTransition] = useTransition();

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Non-blocking Auto-hiding Toast State
  const [toast, setToast] = useState<ToastNotice | null>(null);

  // Modal States
  const [detailModalItem, setDetailModalItem] =
    useState<GallerySelectionSummary | null>(null);
  const [editModalItem, setEditModalItem] =
    useState<GallerySelectionSummary | null>(null);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [deleteModalItem, setDeleteModalItem] =
    useState<GallerySelectionSummary | null>(null);
  const [showTemplateChat, setShowTemplateChat] = useState(false);

  // Edit Form Fields
  const [editForm, setEditForm] = useState({
    clientName: "",
    driveUrl: "",
    maxSelections: 10,
    whatsappNumber: "",
    clientWhatsappNumber: "",
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Detail Modal Copy Format & Search
  const [copyFormat, setCopyFormat] = useState<
    "comma" | "newline" | "whatsapp"
  >("comma");
  const [modalSearch, setModalSearch] = useState("");

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const freshData = await fetchGalleriesWithSelectionsAction();
        setGalleries(freshData);
        showToast("Data berhasil diperbarui.", "success");
      } catch {
        showToast("Gagal memuat ulang data.", "error");
      }
    });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Open Edit Modal
  const openEditModal = (g: GallerySelectionSummary) => {
    setEditModalItem(g);
    setEditForm({
      clientName: g.clientName,
      driveUrl: g.driveFolderId
        ? `https://drive.google.com/drive/folders/${g.driveFolderId}`
        : "",
      maxSelections: g.maxSelections,
      whatsappNumber: g.whatsappNumber || "",
      clientWhatsappNumber: g.clientWhatsappNumber || "",
    });
    setShowEditConfirm(false);
  };

  // Step 1: User clicks "Simpan Perubahan" in form -> Triggers Edit Confirmation Dialog
  const handleFormSubmitTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    setShowEditConfirm(true);
  };

  // Step 2: User confirms in Edit Confirmation Dialog -> Executes updateGalleryAction & shows Toast
  const handleExecuteSaveEdit = async () => {
    if (!editModalItem) return;

    setIsSubmittingEdit(true);
    try {
      const res = await updateGalleryAction(editModalItem.id, editForm);
      if (res.success) {
        const rawDriveUrl = editForm.driveUrl.trim();
        const extractedIdMatch =
          rawDriveUrl.match(/folders\/([a-zA-Z0-9_-]+)/) ||
          rawDriveUrl.match(/id=([a-zA-Z0-9_-]+)/);
        const updatedFolderId = extractedIdMatch
          ? extractedIdMatch[1]
          : rawDriveUrl || editModalItem.driveFolderId;
        const updatedClientName = editForm.clientName;

        setGalleries((prev) =>
          prev.map((item) =>
            item.id === editModalItem.id
              ? {
                  ...item,
                  clientName: updatedClientName,
                  title: `${updatedClientName} Photo Proofing`,
                  driveFolderId: updatedFolderId,
                  maxSelections: editForm.maxSelections,
                  whatsappNumber: editForm.whatsappNumber,
                  clientWhatsappNumber:
                    editForm.clientWhatsappNumber || undefined,
                }
              : item,
          ),
        );

        if (detailModalItem?.id === editModalItem.id) {
          setDetailModalItem((prev) =>
            prev
              ? {
                  ...prev,
                  clientName: updatedClientName,
                  driveFolderId: updatedFolderId,
                  maxSelections: editForm.maxSelections,
                  whatsappNumber: editForm.whatsappNumber,
                  clientWhatsappNumber:
                    editForm.clientWhatsappNumber || undefined,
                }
              : null,
          );
        }

        // Close Edit Form & Confirm Dialog
        setEditModalItem(null);
        setShowEditConfirm(false);

        // Auto-hiding Toast notification (no modal button to click!)
        showToast(
          `Data project "${updatedClientName}" berhasil diperbarui!`,
          "success",
        );
      } else {
        showToast("Gagal memperbarui data project.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan saat mengedit.", "error");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Step 2: User confirms Delete -> Executes deleteGalleryAction & shows Toast
  const handleConfirmDelete = async () => {
    if (!deleteModalItem) return;

    const deletedName = deleteModalItem.clientName;
    setIsSubmittingDelete(true);
    try {
      const res = await deleteGalleryAction(deleteModalItem.id);
      if (res.success) {
        setGalleries((prev) =>
          prev.filter((item) => item.id !== deleteModalItem.id),
        );
        setDeleteModalItem(null);
        if (detailModalItem?.id === deleteModalItem.id) {
          setDetailModalItem(null);
        }

        // Auto-hiding Toast notification (no modal button to click!)
        showToast(`Project "${deletedName}" berhasil dihapus.`, "success");
      } else {
        showToast("Gagal menghapus project.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan saat menghapus.", "error");
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  // Filter logic
  const filteredGalleries = galleries.filter((g) => {
    const matchesSearch =
      g.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.selectedFilenames.some((fn) =>
        fn.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "completed"
          ? g.status === "completed"
          : g.status === "pending";

    return matchesSearch && matchesStatus;
  });

  // Calculate Pagination
  const totalItems = filteredGalleries.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentGalleries = filteredGalleries.slice(startIndex, endIndex);

  const totalCount = galleries.length;
  const completedCount = galleries.filter(
    (g) => g.status === "completed",
  ).length;
  const pendingCount = galleries.filter((g) => g.status === "pending").length;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} telah disalin!`, "success");
  };

  const formatFilenamesForCopy = (
    filenames: string[],
    format: "comma" | "newline" | "whatsapp",
  ) => {
    if (format === "comma") return filenames.join(", ");
    if (format === "newline") return filenames.join("\n");
    return filenames.map((name, i) => `${i + 1}. ${name}`).join("\n");
  };

  return (
    <div className="w-full space-y-4 font-sans">
      {/* Floating Auto-Hiding Toast Notification (No extra clicks needed!) */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-mono font-medium shadow-2xl animate-fade-in ${
            toast.type === "success"
              ? "bg-zinc-900 border-emerald-500/40 text-emerald-300"
              : "bg-zinc-900 border-red-500/40 text-red-300"
          }`}
        >
          {toast.type === "success" ? (
            <svg
              className="h-4 w-4 text-emerald-400 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="h-4 w-4 text-red-400 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header Summary & Search/Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/60 pb-3">
        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
          <div>
            Total:{" "}
            <span className="text-white font-semibold">{totalCount}</span>
          </div>
          <div className="text-emerald-400">
            Selesai: <span className="font-semibold">{completedCount}</span>
          </div>
          <div className="text-amber-400">
            Pending: <span className="font-semibold">{pendingCount}</span>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Cari nama klien / ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-800 pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
            />
          </div>

          <div className="flex items-center rounded-lg bg-zinc-900 p-1 border border-zinc-800 text-[11px] font-mono">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === "all"
                  ? "bg-zinc-800 text-white font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter("completed")}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === "completed"
                  ? "bg-zinc-800 text-emerald-400 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Selesai
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === "pending"
                  ? "bg-zinc-800 text-amber-400 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Pending
            </button>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isPending}
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="Refresh Table"
          >
            <svg
              className={`h-3.5 w-3.5 ${isPending ? "animate-spin text-emerald-400" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-950 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-900/50 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                <th className="py-3 px-4">Nama Klien</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Foto Selected</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-xs text-zinc-300">
              {currentGalleries.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-zinc-500 font-mono text-xs"
                  >
                    Tidak ada project ditemukan.
                  </td>
                </tr>
              ) : (
                currentGalleries.map((g) => {
                  const hasSelections = g.selectedFilenames.length > 0;
                  const displayDate = g.createdAt
                    ? new Date(g.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "-";

                  return (
                    <tr
                      key={g.id}
                      className="hover:bg-zinc-900/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white text-sm">
                            {g.clientName}
                          </span>
                          <span className="font-mono text-[10px] text-zinc-500">
                            ID: {g.id}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-zinc-400 text-xs whitespace-nowrap">
                        {displayDate}
                      </td>

                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {hasSelections ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Sudah Memilih
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                            Belum Memilih
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center whitespace-nowrap font-mono text-xs">
                        <span
                          className={
                            hasSelections
                              ? "text-emerald-400 font-semibold"
                              : "text-zinc-500"
                          }
                        >
                          {g.selectedFilenames.length} / {g.maxSelections}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setDetailModalItem(g);
                              setShowTemplateChat(false);
                            }}
                            className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-mono text-[11px] border border-zinc-800 transition-colors flex items-center gap-1"
                          >
                            <svg
                              className="h-3 w-3 text-emerald-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            <span>Detail</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(g)}
                            className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors border border-zinc-800"
                            title="Edit Data Project"
                          >
                            <svg
                              className="h-3.5 w-3.5 text-amber-400"
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
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteModalItem(g)}
                            className="p-1.5 rounded bg-zinc-900 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 transition-colors border border-zinc-800"
                            title="Hapus Project"
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>

                          <Link
                            href={`/editor?galleryId=${g.id}`}
                            className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-[10px] border border-zinc-800 transition-colors"
                          >
                            Editor ↗
                          </Link>

                          <Link
                            href={`/gallery/${g.id}`}
                            target="_blank"
                            className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-mono text-[10px] border border-emerald-500/20 transition-colors"
                          >
                            Gallery ↗
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-zinc-900/40 border-t border-zinc-800/80 text-xs font-mono text-zinc-400">
            <div>
              Menampilkan{" "}
              <span className="text-white font-semibold">{startIndex + 1}</span>{" "}
              - <span className="text-white font-semibold">{endIndex}</span>{" "}
              dari{" "}
              <span className="text-white font-semibold">{totalItems}</span>{" "}
              project
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Sebelumnya
              </button>

              <span className="px-2 text-zinc-500">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Selanjutnya →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: CLEAN ELEGANT DETAIL MODAL */}
      {detailModalItem &&
        (() => {
          const fullGalleryUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/gallery/${detailModalItem.id}`;
          const driveFolderUrl = `https://drive.google.com/drive/u/0/folders/${detailModalItem.driveFolderId}`;
          const clientChatText = formatClientInvitationMessage({
            driveUrl: driveFolderUrl,
            galleryUrl: fullGalleryUrl,
          });

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fade-in">
              <div className="w-full max-w-xl rounded-2xl bg-zinc-900 border border-zinc-800/90 p-6 shadow-2xl flex flex-col max-h-[85vh] text-zinc-200">
                {/* Clean Modal Header */}
                <div className="flex items-start justify-between border-b border-zinc-800/80 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {detailModalItem.clientName}
                      </h3>
                      {detailModalItem.status === "completed" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Sudah Memilih
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                          Belum Memilih
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      Gallery ID:{" "}
                      <span className="text-zinc-300">
                        {detailModalItem.id}
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setDetailModalItem(null);
                      setModalSearch("");
                      setShowTemplateChat(false);
                    }}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Restful Clean Info List */}
                <div className="py-4 space-y-3 text-xs border-b border-zinc-800/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-zinc-400 font-mono text-[11px]">
                      Public Gallery URL:
                    </span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-zinc-200 truncate max-w-[200px]">
                        /gallery/{detailModalItem.id}
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(fullGalleryUrl, "Link URL Gallery")
                        }
                        className="text-emerald-400 hover:underline text-[11px]"
                      >
                        [Copy Link]
                      </button>
                      <Link
                        href={`/gallery/${detailModalItem.id}`}
                        target="_blank"
                        className="text-zinc-400 hover:text-white text-[11px]"
                      >
                        Buka ↗
                      </Link>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-zinc-400 font-mono text-[11px]">
                      Google Drive Folder:
                    </span>
                    <div className="flex items-center gap-2 font-mono">
                      <span
                        className="text-zinc-200 truncate max-w-[200px]"
                        title={detailModalItem.driveFolderId}
                      >
                        {detailModalItem.driveFolderId}
                      </span>
                      <a
                        href={driveFolderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:underline text-[11px]"
                      >
                        Drive ↗
                      </a>
                      <button
                        onClick={() => openEditModal(detailModalItem)}
                        className="text-amber-400 hover:underline text-[11px]"
                      >
                        Edit Link
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-zinc-400 font-mono text-[11px]">
                      No. WA Fotografer:
                    </span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-zinc-200">
                        {detailModalItem.whatsappNumber || "-"}
                      </span>
                      {detailModalItem.whatsappNumber && (
                        <a
                          href={`https://wa.me/${detailModalItem.whatsappNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:underline text-[11px]"
                        >
                          Chat WA ↗
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-zinc-400 font-mono text-[11px]">
                      No. WA Klien:
                    </span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-zinc-200">
                        {detailModalItem.clientWhatsappNumber || "Belum diisi"}
                      </span>
                      {detailModalItem.clientWhatsappNumber && (
                        <a
                          href={generateClientWhatsAppLink(
                            detailModalItem.clientWhatsappNumber,
                            {
                              driveUrl: driveFolderUrl,
                              galleryUrl: fullGalleryUrl,
                            },
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:underline text-[11px]"
                        >
                          Kirim WA ↗
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1">
                    <span className="text-zinc-400 font-mono text-[11px]">
                      Status Seleksi Foto:
                    </span>
                    <span className="font-mono text-xs font-semibold text-white">
                      {detailModalItem.selectedFilenames.length} /{" "}
                      {detailModalItem.maxSelections} foto terpilih
                    </span>
                  </div>
                </div>

                {/* Minimalist Expandable Template Chat Section */}
                <div className="py-3 border-b border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowTemplateChat(!showTemplateChat)}
                      className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors"
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
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <span>
                        {showTemplateChat
                          ? "Sembunyikan Template Chat WA"
                          : "Lihat Template Chat Klien"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          clientChatText,
                          "Template chat WA klien",
                        )
                      }
                      className="text-[11px] font-mono text-zinc-400 hover:text-white transition-colors"
                    >
                      [Salin Text Chat]
                    </button>
                  </div>

                  {showTemplateChat && (
                    <div className="mt-3 p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-2 animate-fade-in">
                      <pre className="text-[11px] font-sans text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                        {clientChatText}
                      </pre>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-900">
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              clientChatText,
                              "Template chat WA klien",
                            )
                          }
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-mono"
                        >
                          Salin Teks
                        </button>

                        {detailModalItem.clientWhatsappNumber && (
                          <a
                            href={generateClientWhatsAppLink(
                              detailModalItem.clientWhatsappNumber,
                              {
                                driveUrl: driveFolderUrl,
                                galleryUrl: fullGalleryUrl,
                              },
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-[11px] font-mono"
                          >
                            Kirim Langsung ke WA ↗
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Photo Selections List Section */}
                <div className="pt-3 flex flex-col flex-1 min-h-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <h4 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                      Foto Terpilih ({detailModalItem.selectedFilenames.length})
                    </h4>

                    {detailModalItem.selectedFilenames.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-lg bg-zinc-950 p-0.5 border border-zinc-800 text-xs font-mono">
                          <button
                            onClick={() => setCopyFormat("comma")}
                            className={`px-2 py-0.5 rounded transition-colors ${
                              copyFormat === "comma"
                                ? "bg-emerald-500 text-white font-semibold"
                                : "text-zinc-400"
                            }`}
                          >
                            Koma (Lightroom)
                          </button>
                          <button
                            onClick={() => setCopyFormat("newline")}
                            className={`px-2 py-0.5 rounded transition-colors ${
                              copyFormat === "newline"
                                ? "bg-emerald-500 text-white font-semibold"
                                : "text-zinc-400"
                            }`}
                          >
                            Baris Baru
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              formatFilenamesForCopy(
                                detailModalItem.selectedFilenames,
                                copyFormat,
                              ),
                              "Semua nama file",
                            )
                          }
                          className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-xs transition-colors"
                        >
                          Salin Semua
                        </button>
                      </div>
                    )}
                  </div>

                  {detailModalItem.selectedFilenames.length > 0 && (
                    <input
                      type="text"
                      placeholder="Cari nama file foto..."
                      value={modalSearch}
                      onChange={(e) => setModalSearch(e.target.value)}
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 mb-2 focus:outline-none focus:border-zinc-700"
                    />
                  )}

                  {/* Scrollable Filename List */}
                  <div className="flex-1 overflow-y-auto pr-1 space-y-1 max-h-44">
                    {detailModalItem.selectedFilenames.length === 0 ? (
                      <div className="py-4 text-center text-xs text-zinc-500 font-mono">
                        Klien belum memilih foto untuk gallery ini.
                      </div>
                    ) : (
                      detailModalItem.selectedFilenames
                        .filter((fn) =>
                          fn.toLowerCase().includes(modalSearch.toLowerCase()),
                        )
                        .map((name, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 rounded bg-zinc-950/70 border border-zinc-800/60 font-mono text-xs"
                          >
                            <span className="text-zinc-200">
                              {idx + 1}. {name}
                            </span>
                            <button
                              onClick={() => copyToClipboard(name, name)}
                              className="text-[10px] text-zinc-500 hover:text-emerald-400 transition-colors"
                            >
                              [Copy]
                            </button>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(detailModalItem)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-mono transition-colors"
                  >
                    Edit Data Project
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDetailModalItem(null);
                      setShowTemplateChat(false);
                    }}
                    className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* MODAL 2: EDIT FORM MODAL */}
      {editModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">
                Edit Data Project
              </h3>
              <button
                onClick={() => setEditModalItem(null)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmitTrigger} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Nama Klien
                </label>
                <input
                  type="text"
                  required
                  value={editForm.clientName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, clientName: e.target.value })
                  }
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  URL / Folder ID Google Drive
                </label>
                <input
                  type="text"
                  required
                  value={editForm.driveUrl}
                  onChange={(e) =>
                    setEditForm({ ...editForm, driveUrl: e.target.value })
                  }
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-zinc-500 font-mono mt-1">
                  Bisa dimasukkan ulang jika link Google Drive sebelumnya
                  salah/berubah.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Batas Maksimal Seleksi Foto
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={editForm.maxSelections}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      maxSelections: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  No. WhatsApp Fotografer
                </label>
                <input
                  type="text"
                  required
                  value={editForm.whatsappNumber}
                  onChange={(e) =>
                    setEditForm({ ...editForm, whatsappNumber: e.target.value })
                  }
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  No. WhatsApp Klien (Opsional)
                </label>
                <input
                  type="text"
                  value={editForm.clientWhatsappNumber}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      clientWhatsappNumber: e.target.value,
                    })
                  }
                  placeholder="Contoh: 08123456789"
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalItem(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-xs transition-colors"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2.5: EDIT CONFIRMATION MODAL */}
      {showEditConfirm && editModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              Konfirmasi Simpan Perubahan
            </h3>
            <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
              Apakah Anda yakin ingin menyimpan perubahan pada project{" "}
              <span className="text-white font-semibold">
                {editForm.clientName}
              </span>
              ?
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEditConfirm(false)}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteSaveEdit}
                disabled={isSubmittingEdit}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-xs transition-colors disabled:opacity-50"
              >
                {isSubmittingEdit ? "Menyimpan..." : "Ya, Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION MODAL */}
      {deleteModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white">Hapus Project?</h3>
            <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
              Apakah Anda yakin ingin menghapus project{" "}
              <span className="text-white font-semibold">
                {deleteModalItem.clientName}
              </span>{" "}
              ({deleteModalItem.id})? Data yang dihapus tidak dapat
              dikembalikan.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteModalItem(null)}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmittingDelete}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors disabled:opacity-50"
              >
                {isSubmittingDelete ? "Menghapus..." : "Ya, Hapus Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
