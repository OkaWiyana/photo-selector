import { NextRequest, NextResponse } from "next/server";
import { getGoogleDriveClient } from "@/lib/services/gdrive-service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;

  if (!fileId || fileId.startsWith("photo-")) {
    return new NextResponse("Invalid file ID", { status: 400 });
  }

  try {
    const drive = getGoogleDriveClient();

    // 1. Retrieve file metadata to get a fresh, authorized thumbnailLink
    const fileRes = await drive.files.get({
      fileId,
      fields: "id, thumbnailLink",
    });

    let thumbnailUrl = fileRes.data.thumbnailLink;

    if (thumbnailUrl) {
      // Upgrade default 220px thumbnail to high quality 1200px preview
      thumbnailUrl = thumbnailUrl.replace(/=s\d+$/, "=w1200");
      if (!thumbnailUrl.includes("=w1200")) {
        thumbnailUrl = `${thumbnailUrl}=w1200`;
      }
    } else {
      thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
    }

    // 2. Fetch the image content server-side using the fresh URL
    const imgResponse = await fetch(thumbnailUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!imgResponse.ok) {
      // If fetching high-res thumbnail fails, fallback to direct drive thumbnail stream
      return NextResponse.redirect(`https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`, {
        status: 307,
      });
    }

    const contentType = imgResponse.headers.get("content-type") || "image/jpeg";
    const imageBuffer = await imgResponse.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err: unknown) {
    console.error(`Error proxying Drive image [${fileId}]:`, err);
    // Fallback to public drive thumbnail redirect on server error
    return NextResponse.redirect(`https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`, {
      status: 307,
    });
  }
}
