import { Gallery, CreateGalleryInput, CreateGalleryResult, SupabaseGalleryRow } from "@/lib/types/gallery";
import { MOCK_GALLERY } from "@/lib/data/mock-gallery";
import { saveGalleryToStore, getGalleryFromStore } from "@/lib/data/gallery-store";
import { extractDriveFolderId } from "@/lib/utils/gdrive";
import { fetchPhotosFromDriveFolder, FetchDrivePhotosResult } from "@/lib/services/gdrive-service";
import { getSupabaseClient, getSupabaseAdminClient } from "@/lib/supabase/server";

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

  // Validate WhatsApp Number
  const rawPhone = input.whatsappNumber?.trim() || "";
  const cleanPhone = rawPhone.replace(/\D/g, "");
  if (!rawPhone) {
    errors.whatsappNumber = "Photographer WhatsApp number is required.";
  } else if (cleanPhone.length < 8) {
    errors.whatsappNumber = "Please enter a valid WhatsApp number (at least 8 digits).";
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

  const supabase = getSupabaseAdminClient() || getSupabaseClient();
  if (supabase) {
    try {
      const selectionId = `sel_${galleryId}`;
      const payload = {
        id: selectionId,
        gallery_id: galleryId,
        selected_filenames: selectedFilenames,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("gallery_selections").upsert(payload);

      if (!error) {
        console.log(`[Supabase Success] Saved ${selectedFilenames.length} selections for gallery ${galleryId}`);
        return true;
      }
      console.warn("[Supabase Error] saveGallerySelection failed:", error.message, error.details);
    } catch (err) {
      console.warn("[Supabase Exception] saveGallerySelection:", err);
    }
  } else {
    console.warn("[Supabase] No client initialized. Check NEXT_PUBLIC_SUPABASE_URL in .env.local");
  }
  return false;
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

  return {
    clientName: result.gallery.clientName,
    galleryTitle: result.gallery.title,
    selectedFilenames,
  };
}

