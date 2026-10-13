import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/server";
import { MOCK_GALLERY } from "@/lib/data/mock-gallery";
import {
  getGalleryFromStore,
  getMockSharedSelections,
} from "@/lib/data/gallery-store";

/**
 * GET /api/selections/[galleryId]
 * Returns the current shared selections for a gallery.
 * Used for initial data load and WhatsApp message generation.
 * Supports both Supabase database and local demo/mock galleries.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ galleryId: string }> }
) {
  const { galleryId } = await params;

  if (!galleryId || typeof galleryId !== "string" || galleryId.length > 100) {
    return NextResponse.json(
      { error: "Invalid gallery ID" },
      { status: 400 }
    );
  }

  try {
    let galleryInfo: {
      id: string;
      maxSelections: number;
      clientName: string;
      whatsappNumber: string;
    } | null = null;
    let selections: { photo_id: string; photo_name: string; selected_at: string }[] = [];

    // 1. Try querying Supabase if available
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: dbGallery, error: galleryError } = await supabase
          .from("galleries")
          .select("id, max_selections, client_name, whatsapp_number")
          .eq("id", galleryId)
          .maybeSingle();

        if (dbGallery && !galleryError) {
          galleryInfo = {
            id: dbGallery.id,
            maxSelections: dbGallery.max_selections,
            clientName: dbGallery.client_name,
            whatsappNumber: dbGallery.whatsapp_number,
          };

          const { data: dbSelections, error: selectionsError } = await supabase
            .from("shared_selections")
            .select("photo_id, photo_name, selected_at")
            .eq("gallery_id", galleryId)
            .order("selected_at", { ascending: true });

          if (!selectionsError && dbSelections) {
            selections = dbSelections;
          }
        }
      } catch (dbErr) {
        console.warn("[API] Supabase query error, checking fallback store:", dbErr);
      }
    }

    // 2. Fallback to mock / in-memory store for demo galleries or local testing
    if (!galleryInfo) {
      const fallbackGallery =
        galleryId === "demo" || galleryId === "sample"
          ? MOCK_GALLERY
          : getGalleryFromStore(galleryId);

      if (fallbackGallery) {
        galleryInfo = {
          id: fallbackGallery.id,
          maxSelections: fallbackGallery.maxSelections,
          clientName: fallbackGallery.clientName,
          whatsappNumber: fallbackGallery.whatsappNumber,
        };
        selections = getMockSharedSelections(galleryId);
      }
    }

    if (!galleryInfo) {
      return NextResponse.json(
        { error: "Gallery not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      galleryId: galleryInfo.id,
      maxSelections: galleryInfo.maxSelections,
      clientName: galleryInfo.clientName,
      whatsappNumber: galleryInfo.whatsappNumber,
      selections: selections || [],
    });
  } catch (err) {
    console.error("[API] Unexpected error fetching selections:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
