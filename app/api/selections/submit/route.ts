import { NextRequest, NextResponse } from "next/server";
import { saveGallerySelection } from "@/lib/services/gallery-service";

interface SubmitRequestBody {
  galleryId: string;
  filenames: string[];
}

/**
 * POST /api/selections/submit
 * Records official client selection submission when "Kirim ke WhatsApp" is clicked.
 * Persists selected filenames to gallery_selections table in Supabase and local fallback store.
 */
export async function POST(request: NextRequest) {
  try {
    const body: SubmitRequestBody = await request.json();
    const { galleryId, filenames } = body;

    if (!galleryId || typeof galleryId !== "string" || galleryId.length > 100) {
      return NextResponse.json(
        { error: "Invalid gallery ID" },
        { status: 400 }
      );
    }

    if (!Array.isArray(filenames) || filenames.length === 0) {
      return NextResponse.json(
        { error: "At least one photo must be selected to submit" },
        { status: 400 }
      );
    }

    // Sanitize filenames array
    const cleanFilenames = filenames
      .filter((fn) => typeof fn === "string" && fn.trim().length > 0)
      .slice(0, 1000);

    const success = await saveGallerySelection(galleryId, cleanFilenames);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to persist submitted selections" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      galleryId,
      submittedCount: cleanFilenames.length,
      submittedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[API] Error in /api/selections/submit:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
