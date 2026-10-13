"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface SharedSelection {
  photo_id: string;
  photo_name: string;
  selected_at: string;
}

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export type ToggleResult = {
  action: "selected" | "deselected" | "limit_reached";
  count: number;
  max: number;
  photo_id: string;
};

interface UseSharedSelectionsOptions {
  galleryId: string;
  maxSelections: number;
}

interface UseSharedSelectionsReturn {
  /** Set of currently selected photo IDs */
  selectedIds: Set<string>;
  /** Map of photo_id → photo_name for selected photos */
  selectedPhotos: Map<string, string>;
  /** Current count of selections */
  selectionCount: number;
  /** Toggle a photo selection (calls server API) */
  toggleSelection: (photoId: string, photoName: string) => Promise<ToggleResult | null>;
  /** Whether a toggle operation is currently in progress */
  isToggling: boolean;
  /** Realtime connection status */
  connectionStatus: ConnectionStatus;
  /** Last error message, if any */
  lastError: string | null;
  /** Whether initial data has been loaded */
  isLoaded: boolean;
}

/**
 * Custom hook that manages shared photo selections with Supabase Realtime sync.
 * 
 * Design decisions:
 * - Uses Postgres Changes (not Broadcast) because selections must be persisted
 *   and the table already has RLS policies. Postgres Changes automatically
 *   syncs INSERT/DELETE events from the shared_selections table.
 * - Optimistic updates for immediate UI feedback, with server reconciliation.
 * - Tracks in-flight toggle operations to prevent double-clicks.
 * - Handles reconnection by re-fetching full state to avoid missed events.
 */
export function useSharedSelections({
  galleryId,
  maxSelections,
}: UseSharedSelectionsOptions): UseSharedSelectionsReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedPhotos, setSelectedPhotos] = useState<Map<string, string>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [lastError, setLastError] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const inFlightRef = useRef<Set<string>>(new Set());
  const mountedRef = useRef(true);

  // Helper to update both selectedIds and selectedPhotos from a selections array
  const updateFromSelections = useCallback((selections: SharedSelection[]) => {
    const ids = new Set<string>();
    const photos = new Map<string, string>();
    for (const s of selections) {
      ids.add(s.photo_id);
      photos.set(s.photo_id, s.photo_name);
    }
    setSelectedIds(ids);
    setSelectedPhotos(photos);
  }, []);

  // Fetch current selections from server
  const fetchSelections = useCallback(async () => {
    try {
      const res = await fetch(`/api/selections/${encodeURIComponent(galleryId)}`);
      if (!res.ok) {
        console.warn(`[useSharedSelections] Selections endpoint returned HTTP ${res.status}`);
        if (mountedRef.current) {
          setIsLoaded(true);
        }
        return;
      }
      const data = await res.json();
      if (mountedRef.current) {
        updateFromSelections(data.selections || []);
        setIsLoaded(true);
      }
    } catch (err) {
      console.warn("[useSharedSelections] Failed to fetch selections:", err);
      if (mountedRef.current) {
        setLastError("Failed to load selections");
        setIsLoaded(true); // Mark as loaded even on error to unblock UI
      }
    }
  }, [galleryId, updateFromSelections]);

  // Setup Realtime subscription
  useEffect(() => {
    mountedRef.current = true;
    const supabase = getSupabaseBrowserClient();

    // Initial fetch
    fetchSelections();

    if (!supabase) {
      setConnectionStatus("error");
      setLastError("Realtime connection unavailable");
      return;
    }

    const channelName = `shared_selections:${galleryId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes" as "system", // Type workaround for Supabase SDK
        {
          event: "INSERT",
          schema: "public",
          table: "shared_selections",
          filter: `gallery_id=eq.${galleryId}`,
        } as Record<string, unknown>,
        (payload: { new: { photo_id: string; photo_name: string; selected_at: string } }) => {
          if (!mountedRef.current) return;
          const { photo_id, photo_name } = payload.new;

          // Skip if this is our own in-flight optimistic update
          if (inFlightRef.current.has(photo_id)) {
            inFlightRef.current.delete(photo_id);
            return;
          }

          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.add(photo_id);
            return next;
          });
          setSelectedPhotos((prev) => {
            const next = new Map(prev);
            next.set(photo_id, photo_name);
            return next;
          });
        }
      )
      .on(
        "postgres_changes" as "system",
        {
          event: "DELETE",
          schema: "public",
          table: "shared_selections",
          filter: `gallery_id=eq.${galleryId}`,
        } as Record<string, unknown>,
        (payload: { old: { photo_id: string } }) => {
          if (!mountedRef.current) return;
          const { photo_id } = payload.old;

          if (inFlightRef.current.has(photo_id)) {
            inFlightRef.current.delete(photo_id);
            return;
          }

          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(photo_id);
            return next;
          });
          setSelectedPhotos((prev) => {
            const next = new Map(prev);
            next.delete(photo_id);
            return next;
          });
        }
      )
      .subscribe((status: string) => {
        if (!mountedRef.current) return;

        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected");
          setLastError(null);
        } else if (status === "CHANNEL_ERROR") {
          setConnectionStatus("error");
          setLastError("Realtime subscription error");
        } else if (status === "TIMED_OUT") {
          setConnectionStatus("disconnected");
          // Re-fetch to catch any missed events during disconnection
          fetchSelections();
        } else if (status === "CLOSED") {
          setConnectionStatus("disconnected");
        }
      });

    channelRef.current = channel;

    return () => {
      mountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [galleryId, fetchSelections]);

  // Toggle selection via server API with optimistic update
  const toggleSelection = useCallback(
    async (photoId: string, photoName: string): Promise<ToggleResult | null> => {
      if (isToggling) return null;

      const currentlySelected = selectedIds.has(photoId);

      // Optimistic: check limit client-side first (server still enforces)
      if (!currentlySelected && selectedIds.size >= maxSelections) {
        return {
          action: "limit_reached",
          count: selectedIds.size,
          max: maxSelections,
          photo_id: photoId,
        };
      }

      setIsToggling(true);
      setLastError(null);

      // Mark as in-flight to avoid double-applying from Realtime event
      inFlightRef.current.add(photoId);

      // Optimistic UI update
      if (currentlySelected) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(photoId);
          return next;
        });
        setSelectedPhotos((prev) => {
          const next = new Map(prev);
          next.delete(photoId);
          return next;
        });
      } else {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.add(photoId);
          return next;
        });
        setSelectedPhotos((prev) => {
          const next = new Map(prev);
          next.set(photoId, photoName);
          return next;
        });
      }

      try {
        const res = await fetch("/api/selections/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ galleryId, photoId, photoName }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.warn(`[useSharedSelections] Toggle returned HTTP ${res.status}:`, errData);
          inFlightRef.current.delete(photoId);

          // Revert optimistic update
          if (currentlySelected) {
            setSelectedIds((prev) => new Set(prev).add(photoId));
            setSelectedPhotos((prev) => new Map(prev).set(photoId, photoName));
          } else {
            setSelectedIds((prev) => {
              const next = new Set(prev);
              next.delete(photoId);
              return next;
            });
            setSelectedPhotos((prev) => {
              const next = new Map(prev);
              next.delete(photoId);
              return next;
            });
          }

          if (mountedRef.current) {
            setLastError(errData?.error || "Failed to update selection");
            setTimeout(() => setLastError(null), 3000);
          }
          return null;
        }

        const result: ToggleResult = await res.json();

        // Server says limit reached — revert optimistic add
        if (result.action === "limit_reached") {
          inFlightRef.current.delete(photoId);
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(photoId);
            return next;
          });
          setSelectedPhotos((prev) => {
            const next = new Map(prev);
            next.delete(photoId);
            return next;
          });
        }

        return result;
      } catch (err) {
        console.error("[useSharedSelections] Toggle failed:", err);
        inFlightRef.current.delete(photoId);

        // Revert optimistic update
        if (currentlySelected) {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.add(photoId);
            return next;
          });
          setSelectedPhotos((prev) => {
            const next = new Map(prev);
            next.set(photoId, photoName);
            return next;
          });
        } else {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(photoId);
            return next;
          });
          setSelectedPhotos((prev) => {
            const next = new Map(prev);
            next.delete(photoId);
            return next;
          });
        }

        setLastError("Failed to update selection. Please try again.");
        return null;
      } finally {
        setIsToggling(false);
      }
    },
    [galleryId, selectedIds, maxSelections, isToggling]
  );

  return {
    selectedIds,
    selectedPhotos,
    selectionCount: selectedIds.size,
    toggleSelection,
    isToggling,
    connectionStatus,
    lastError,
    isLoaded,
  };
}
