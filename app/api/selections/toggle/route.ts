import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { MOCK_GALLERY } from "@/lib/data/mock-gallery";
import {
  getGalleryFromStore,
  toggleMockSharedSelection,
} from "@/lib/data/gallery-store";

interface ToggleRequestBody {
  galleryId: string;
  photoId: string;
  photoName: string;
}

/**
 * POST /api/selections/toggle
 * Atomically toggles a photo selection using the database function
 * to enforce the max selection limit safely against race conditions.
 * Supports fallback for demo/mock galleries.
 */
export async function POST(request: NextRequest) {
  let body: ToggleRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { galleryId, photoId, photoName } = body;

  // Validate required fields
  if (!galleryId || typeof galleryId !== "string") {
    return NextResponse.json(
      { error: "galleryId is required" },
      { status: 400 }
    );
  }
  if (!photoId || typeof photoId !== "string") {
    return NextResponse.json(
      { error: "photoId is required" },
      { status: 400 }
    );
  }
  if (!photoName || typeof photoName !== "string") {
    return NextResponse.json(
      { error: "photoName is required" },
      { status: 400 }
    );
  }

  // Sanitize inputs
  if (galleryId.length > 100 || photoId.length > 200 || photoName.length > 500) {
    return NextResponse.json(
      { error: "Input values exceed maximum length" },
      { status: 400 }
    );
  }

  // 1. Handle mock/demo or in-memory gallery first if applicable
  const isMock = galleryId === "demo" || galleryId === "sample";
  const inStoreGallery = isMock ? MOCK_GALLERY : getGalleryFromStore(galleryId);

  if (inStoreGallery) {
    const result = toggleMockSharedSelection(
      galleryId,
      photoId,
      photoName,
      inStoreGallery.maxSelections
    );
    return NextResponse.json(result);
  }

  // 2. Otherwise use Supabase database
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database connection unavailable" },
      { status: 503 }
    );
  }

  try {
    // Call the atomic database function
    const { data, error } = await supabase.rpc("toggle_photo_selection", {
      p_gallery_id: galleryId,
      p_photo_id: photoId,
      p_photo_name: photoName,
    });

    if (error) {
      console.error("[API] toggle_photo_selection error:", error.message);

      if (error.message.includes("Gallery not found")) {
        return NextResponse.json(
          { error: "Gallery not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: "Failed to update selection" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[API] Unexpected error in toggle:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
