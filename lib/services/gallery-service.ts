import { Gallery, CreateGalleryInput, CreateGalleryResult, SupabaseGalleryRow } from "@/lib/types/gallery";
import { MOCK_GALLERY } from "@/lib/data/mock-gallery";
import {
  saveGalleryToStore,
  getGalleryFromStore,
  getAllGalleriesFromStore,
  saveSelectionToStore,
  getSelectionFromStore,
  getAllSelectionsFromStore,
  deleteGalleryFromStore,
  updateGalleryInStore,
  getMockSharedSelections,
} from "@/lib/data/gallery-store";
import { extractDriveFolderId } from "@/lib/utils/gdrive";
import { fetchPhotosFromDriveFolder, FetchDrivePhotosResult } from "@/lib/services/gdrive-service";
import { getSupabaseClient, getSupabaseAdminClient } from "@/lib/supabase/server";
import { formatPhoneNumberForWhatsApp } from "@/lib/utils/whatsapp";

export interface GetGalleryWithPhotosResult {
  gallery: Gallery | null;
  error?: "NOT_FOUND" | "INACCESSIBLE_FOLDER" | "NO_IMAGES_FOUND" | "MISSING_CREDENTIALS" | "API_ERROR";
  errorMessage?: string;
}

/**
 * Service layer for retrieving gallery configuration from Supabase (or fallback)
 * and fetching real photos from Google Drive API.
 */
export async function getGalleryWithPhotos(id: string): Promise<GetGalleryWithPhotosResult> {
  if (!id) {
    return { gallery: null, error: "NOT_FOUND" };
  }

  // Handle default demo galleries
  if (id === "demo" || id === "sample") {
    return {
      gallery: MOCK_GALLERY,
    };
  }

  let storedGallery: Gallery | null = null;

  // 1. Primary Source of Truth: Query Supabase galleries table
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("galleries")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (data && !error) {
        const row = data as SupabaseGalleryRow;
        storedGallery = {
          id: row.id,
          title: `${row.client_name} Photo Proofing`,
          clientName: row.client_name,
          driveFolderId: row.drive_folder_id,
          maxSelections: row.max_selections,
          whatsappNumber: row.whatsapp_number,
          clientWhatsappNumber: row.client_whatsapp_number || undefined,
          createdAt: row.created_at,
          photos: [],
        };
      }
    } catch {
      // Ignore database connection error and fallback to memory store
    }
  }

  // 2. Secondary Fallback: Check local in-memory store if not found in Supabase
  if (!storedGallery) {
    storedGallery = getGalleryFromStore(id) || null;
  }

  if (!storedGallery) {
    return { gallery: null, error: "NOT_FOUND" };
  }

  // 3. Retrieve real photos from Google Drive API using configured driveFolderId
  const driveResult: FetchDrivePhotosResult = await fetchPhotosFromDriveFolder(storedGallery.driveFolderId);

  if (driveResult.error || driveResult.photos.length === 0) {
    if (driveResult.error === "MISSING_CREDENTIALS" || driveResult.error === "INACCESSIBLE_FOLDER") {
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        return {
          gallery: {
            ...storedGallery,
            photos: MOCK_GALLERY.photos, // Fallback to mock photos for dev testing without Google credentials
          },
          error: "MISSING_CREDENTIALS",
          errorMessage: driveResult.errorMessage,
        };
      }

      return {
        gallery: storedGallery,
        error: driveResult.error,
        errorMessage: driveResult.errorMessage,
      };
    }

    if (driveResult.error === "NO_IMAGES_FOUND") {
      return {
        gallery: storedGallery,
        error: "NO_IMAGES_FOUND",
        errorMessage: driveResult.errorMessage,
      };
    }

    return {
      gallery: {
        ...storedGallery,
        photos: MOCK_GALLERY.photos,
      },
      error: driveResult.error,
      errorMessage: driveResult.errorMessage,
    };
  }

  return {
    gallery: {
      ...storedGallery,
      photos: driveResult.photos,
    },
  };
}

/**
 * Legacy compatibility export for getGalleryById
 */
export async function getGalleryById(id: string): Promise<Gallery | null> {
  const result = await getGalleryWithPhotos(id);
  return result.gallery;
}

/**
 * Validates gallery input, extracts Google Drive folder ID, generates unique gallery ID,
 * and persists configuration into Supabase database (using server-side service role client).
 */
export async function createGalleryConfig(
  input: CreateGalleryInput
): Promise<CreateGalleryResult> {
  const errors: CreateGalleryResult["errors"] = {};

  // Validate Client Name
  const clientName = input.clientName?.trim() || "";
  if (!clientName) {
    errors.clientName = "Client name is required.";
  }

  // Validate Google Drive URL
  const driveUrl = input.driveUrl?.trim() || "";
  const driveFolderId = extractDriveFolderId(driveUrl);
  if (!driveUrl) {
    errors.driveUrl = "Google Drive folder URL is required.";
  } else if (!driveFolderId) {
    errors.driveUrl =
      "Invalid Google Drive folder URL. Please enter a valid URL (e.g., https://drive.google.com/drive/folders/...).";
  }

  // Validate Max Selections
  const maxSelections = Number(input.maxSelections);
  if (isNaN(maxSelections) || !Number.isInteger(maxSelections) || maxSelections <= 0) {
    errors.maxSelections = "Maximum selections must be a positive integer (e.g. 10).";
  }

  // Validate WhatsApp Number (Photographer)
  const rawPhone = input.whatsappNumber?.trim() || "";
  const cleanPhone = rawPhone ? formatPhoneNumberForWhatsApp(rawPhone) : "";
  if (!rawPhone) {
    errors.whatsappNumber = "Photographer WhatsApp number is required.";
  } else if (cleanPhone.length < 8) {
    errors.whatsappNumber = "Please enter a valid WhatsApp number (at least 8 digits).";
  }

  // Optional Client WhatsApp Number
  const rawClientPhone = input.clientWhatsappNumber?.trim() || "";
  const cleanClientPhone = rawClientPhone ? formatPhoneNumberForWhatsApp(rawClientPhone) : "";
  if (rawClientPhone && cleanClientPhone.length < 8) {
    errors.clientWhatsappNumber = "Please enter a valid WhatsApp number for the client (at least 8 digits).";
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      errors,
    };
  }

  // Generate unique gallery ID safe for public URLs
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const galleryId = `gal_${Date.now().toString(36)}_${randomSuffix}`;

  const newGallery: Gallery = {
    id: galleryId,
    title: `${clientName} Photo Proofing`,
    clientName,
    driveFolderId: driveFolderId!,
    maxSelections,
    whatsappNumber: cleanPhone,
    clientWhatsappNumber: cleanClientPhone || undefined,
    photos: [],
    createdAt: new Date().toISOString(),
  };

  // 1. Primary Storage: Insert gallery record into Supabase via server-side service-role client
  const supabaseAdmin = getSupabaseAdminClient();
  if (supabaseAdmin) {
    const { error: dbError } = await supabaseAdmin.from("galleries").insert({
      id: galleryId,
      client_name: clientName,
      drive_folder_id: driveFolderId!,
      max_selections: maxSelections,
      whatsapp_number: cleanPhone,
      client_whatsapp_number: cleanClientPhone || null,
    });

    if (dbError) {
      console.warn("Supabase database insert warning (falling back to memory cache):", dbError.message);
    }
  }

  // 2. Secondary Cache: Save to local memory store as fallback
  saveGalleryToStore(newGallery);

  return {
    success: true,
    galleryId,
    galleryUrl: `/gallery/${galleryId}`,
    driveUrl,
    clientWhatsappNumber: cleanClientPhone || undefined,
  };
}

/**
 * Saves client selected photo filenames for a specific gallery ID to Supabase (or memory store)
 */
export async function saveGallerySelection(
  galleryId: string,
  selectedFilenames: string[]
): Promise<boolean> {
  if (!galleryId || !selectedFilenames || selectedFilenames.length === 0) return false;

  // Always persist to local runtime memory store as immediate fallback
  saveSelectionToStore(galleryId, selectedFilenames);

  const supabase = getSupabaseAdminClient() || getSupabaseClient();
  if (supabase) {
    try {
      // Check if a selection record already exists for this gallery_id
      const { data: existing } = await supabase
        .from("gallery_selections")
        .select("id")
        .eq("gallery_id", galleryId)
        .maybeSingle();

      let error = null;

      if (existing) {
        // Update existing record
        const res = await supabase
          .from("gallery_selections")
          .update({
            selected_filenames: selectedFilenames,
            created_at: new Date().toISOString(),
          })
          .eq("gallery_id", galleryId);
        error = res.error;
      } else {
        // Insert new record
        const res = await supabase.from("gallery_selections").insert({
          id: `sel_${galleryId}`,
          gallery_id: galleryId,
          selected_filenames: selectedFilenames,
          created_at: new Date().toISOString(),
        });
        error = res.error;
      }

      if (!error) {
        console.log(`[Supabase Success] Saved ${selectedFilenames.length} selections for gallery ${galleryId}`);
        return true;
      }
      console.warn("[Supabase Error] saveGallerySelection failed:", error.message, error.details);
    } catch (err) {
      console.warn("[Supabase Exception] saveGallerySelection:", err);
    }
  } else {
    console.warn("[Supabase] No client initialized. Saved selection to local memory store.");
  }
  return true;
}

/**
 * Retrieves client selected filenames and gallery metadata for Editor Workspace integration
 */
export async function getGallerySelection(galleryId: string): Promise<{
  clientName: string;
  galleryTitle: string;
  selectedFilenames: string[];
} | null> {
  const result = await getGalleryWithPhotos(galleryId);
  if (!result.gallery) return null;

  let selectedFilenames: string[] = [];

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from("gallery_selections")
        .select("selected_filenames")
        .eq("gallery_id", galleryId)
        .maybeSingle();

      if (data && data.selected_filenames) {
        selectedFilenames = data.selected_filenames as string[];
      }
    } catch {
      // ignore error
    }
  }

  // Fallback to local memory store if not found in Supabase
  if (selectedFilenames.length === 0) {
    const memSelection = getSelectionFromStore(galleryId);
    if (memSelection) {
      selectedFilenames = memSelection.selectedFilenames;
    }
  }

  return {
    clientName: result.gallery.clientName,
    galleryTitle: result.gallery.title,
    selectedFilenames,
  };
}

export interface GallerySelectionSummary {
  id: string;
  clientName: string;
  title: string;
  driveFolderId: string;
  maxSelections: number;
  whatsappNumber: string;
  clientWhatsappNumber?: string;
  createdAt?: string;
  selectedFilenames: string[];
  updatedAt?: string;
  submittedAt?: string;
  status: "completed" | "draft" | "pending";
}

/**
 * Retrieves list of all created galleries with client selections for Photographer Dashboard.
 * Merges data from both legacy gallery_selections (submitted via WA) and new shared_selections (live sync) tables.
 */
export async function getAllGalleriesWithSelections(): Promise<GallerySelectionSummary[]> {
  const supabase = getSupabaseClient() || getSupabaseAdminClient();
  const summaryMap = new Map<string, GallerySelectionSummary>();

  // 1. Fetch from Supabase if available
  if (supabase) {
    try {
      const { data: galleries } = await supabase
        .from("galleries")
        .select("*")
        .order("created_at", { ascending: false });

      if (galleries && galleries.length > 0) {
        // Fetch legacy/submitted selections
        const { data: legacySelections } = await supabase
          .from("gallery_selections")
          .select("*");

        const legacyMap = new Map<string, { filenames: string[]; updatedAt?: string }>();
        if (legacySelections) {
          for (const s of legacySelections) {
            legacyMap.set(s.gallery_id, {
              filenames: (s.selected_filenames as string[]) || [],
              updatedAt: s.created_at,
            });
          }
        }

        // Fetch shared selections (new per-row format for live device sync)
        const { data: sharedSelections } = await supabase
          .from("shared_selections")
          .select("gallery_id, photo_name, selected_at")
          .order("selected_at", { ascending: true });

        const sharedMap = new Map<string, { filenames: string[]; updatedAt?: string }>();
        if (sharedSelections) {
          for (const s of sharedSelections) {
            const existing = sharedMap.get(s.gallery_id);
            if (existing) {
              existing.filenames.push(s.photo_name);
              existing.updatedAt = s.selected_at;
            } else {
              sharedMap.set(s.gallery_id, {
                filenames: [s.photo_name],
                updatedAt: s.selected_at,
              });
            }
          }
        }

        for (const g of galleries) {
          // Prefer shared_selections (live state) over legacy gallery_selections,
          // but if shared_selections is empty, fallback to legacy gallery_selections.
          const shared = sharedMap.get(g.id);
          const legacy = legacyMap.get(g.id);
          const sel = shared && shared.filenames.length > 0 ? shared : legacy;
          const filenames = sel?.filenames || [];

          // Determine status:
          // - "pending": 0 photos selected
          // - "completed": Client has clicked "Kirim ke WhatsApp" or legacy submission exists
          // - "draft": Photos are selected in live sync, but client has not clicked submit/WA yet
          let status: "completed" | "draft" | "pending" = "pending";
          let submittedAt: string | undefined = undefined;

          if (filenames.length === 0) {
            status = "pending";
          } else if (legacy && legacy.filenames.length > 0) {
            status = "completed";
            submittedAt = legacy.updatedAt;
          } else {
            status = "draft";
          }

          summaryMap.set(g.id, {
            id: g.id,
            clientName: g.client_name,
            title: `${g.client_name} Photo Proofing`,
            driveFolderId: g.drive_folder_id,
            maxSelections: g.max_selections,
            whatsappNumber: g.whatsapp_number,
            clientWhatsappNumber: g.client_whatsapp_number || undefined,
            createdAt: g.created_at,
            selectedFilenames: filenames,
            updatedAt: sel?.updatedAt,
            submittedAt,
            status,
          });
        }
      }
    } catch (err) {
      console.warn("Failed fetching galleries from Supabase (falling back to memory store):", err);
    }
  }

  // 2. Fallback / Merge with in-memory store (ensures dev runtime and demo data are always visible)
  const memoryGalleries = getAllGalleriesFromStore();
  const memorySelections = getAllSelectionsFromStore();

  for (const g of memoryGalleries) {
    if (!summaryMap.has(g.id)) {
      const memSel = memorySelections.get(g.id);
      const mockShared = getMockSharedSelections(g.id);
      const mockSharedFilenames = mockShared.map((item) => item.photo_name);

      const hasSubmitted = Boolean(memSel && memSel.selectedFilenames.length > 0);
      const filenames = mockSharedFilenames.length > 0 ? mockSharedFilenames : (memSel?.selectedFilenames || []);

      let status: "completed" | "draft" | "pending" = "pending";
      let submittedAt: string | undefined = undefined;

      if (filenames.length === 0) {
        status = "pending";
      } else if (hasSubmitted) {
        status = "completed";
        submittedAt = memSel?.updatedAt;
      } else {
        status = "draft";
      }

      summaryMap.set(g.id, {
        id: g.id,
        clientName: g.clientName,
        title: g.title || `${g.clientName} Photo Proofing`,
        driveFolderId: g.driveFolderId,
        maxSelections: g.maxSelections,
        whatsappNumber: g.whatsappNumber,
        clientWhatsappNumber: g.clientWhatsappNumber,
        createdAt: g.createdAt || new Date().toISOString(),
        selectedFilenames: filenames,
        updatedAt: memSel?.updatedAt || (mockShared[mockShared.length - 1]?.selected_at),
        submittedAt,
        status,
      });
    }
  }

  // Return array sorted by creation date descending
  return Array.from(summaryMap.values()).sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });
}

/**
 * Updates an existing gallery configuration (e.g. client name, drive folder URL, max selections, whatsapp numbers)
 */
export async function updateGalleryConfig(
  id: string,
  input: {
    clientName?: string;
    driveUrl?: string;
    maxSelections?: number;
    whatsappNumber?: string;
    clientWhatsappNumber?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!id) return { success: false, error: "Gallery ID is required" };

  const updates: Record<string, unknown> = {};
  let newDriveFolderId: string | undefined = undefined;

  if (input.clientName !== undefined && input.clientName.trim()) {
    updates.client_name = input.clientName.trim();
  }
  if (input.driveUrl !== undefined && input.driveUrl.trim()) {
    const extractedId = extractDriveFolderId(input.driveUrl.trim());
    if (extractedId) {
      newDriveFolderId = extractedId;
      updates.drive_folder_id = extractedId;
    }
  }
  if (input.maxSelections !== undefined && !isNaN(input.maxSelections) && input.maxSelections > 0) {
    updates.max_selections = Number(input.maxSelections);
  }
  if (input.whatsappNumber !== undefined && input.whatsappNumber.trim()) {
    updates.whatsapp_number = formatPhoneNumberForWhatsApp(input.whatsappNumber.trim());
  }
  if (input.clientWhatsappNumber !== undefined) {
    const raw = input.clientWhatsappNumber.trim();
    updates.client_whatsapp_number = raw ? formatPhoneNumberForWhatsApp(raw) : null;
  }

  // Update memory store
  updateGalleryInStore(id, {
    clientName: input.clientName?.trim(),
    driveFolderId: newDriveFolderId,
    maxSelections: input.maxSelections ? Number(input.maxSelections) : undefined,
    whatsappNumber: input.whatsappNumber ? formatPhoneNumberForWhatsApp(input.whatsappNumber.trim()) : undefined,
    clientWhatsappNumber:
      input.clientWhatsappNumber !== undefined
        ? input.clientWhatsappNumber.trim()
          ? formatPhoneNumberForWhatsApp(input.clientWhatsappNumber.trim())
          : undefined
        : undefined,
  });

  // Update Supabase if available
  const supabase = getSupabaseAdminClient() || getSupabaseClient();
  if (supabase && Object.keys(updates).length > 0) {
    try {
      const { error } = await supabase.from("galleries").update(updates).eq("id", id);
      if (error) {
        console.warn("Supabase update error:", error.message);
      }
    } catch (err) {
      console.warn("Supabase update exception:", err);
    }
  }

  return { success: true };
}

/**
 * Deletes a gallery configuration and its client selections
 */
export async function deleteGalleryConfig(id: string): Promise<{ success: boolean; error?: string }> {
  if (!id) return { success: false, error: "Gallery ID is required" };

  // Delete from memory store
  deleteGalleryFromStore(id);

  // Delete from Supabase if available
  const supabase = getSupabaseAdminClient() || getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from("shared_selections").delete().eq("gallery_id", id);
      await supabase.from("gallery_selections").delete().eq("gallery_id", id);
      const { error } = await supabase.from("galleries").delete().eq("id", id);
      if (error) {
        console.warn("Supabase delete error:", error.message);
      }
    } catch (err) {
      console.warn("Supabase delete exception:", err);
    }
  }

  return { success: true };
}


