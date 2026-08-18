import { google } from "googleapis";
import { Photo } from "@/lib/types/gallery";

export interface FetchDrivePhotosResult {
  photos: Photo[];
  error?: "MISSING_CREDENTIALS" | "INACCESSIBLE_FOLDER" | "NO_IMAGES_FOUND" | "API_ERROR";
  errorMessage?: string;
}

/**
 * Initializes Google Drive v3 client using Service Account credentials from environment variables.
 * Note: Credentials must ONLY be accessed server-side.
 */
export function getGoogleDriveClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !rawPrivateKey) {
    throw new Error(
      "MISSING_CREDENTIALS: GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY environment variables are required."
    );
  }

  // Handle escaped \n characters in private key string
  const privateKey = rawPrivateKey.replace(/\\n/g, "\n");

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  return google.drive({ version: "v3", auth });
}

type DriveFile = {
  id?: string | null;
  name?: string | null;
  mimeType?: string | null;
  thumbnailLink?: string | null;
  webContentLink?: string | null;
  imageMediaMetadata?: { width?: number | null; height?: number | null } | null;
};

/**
 * Fetches image files directly inside a Google Drive folder with full pagination support.
 * Returns formatted Photo objects or detailed error status.
 */
export async function fetchPhotosFromDriveFolder(
  folderId: string
): Promise<FetchDrivePhotosResult> {
  if (!folderId || folderId.trim() === "") {
    return {
      photos: [],
      error: "INACCESSIBLE_FOLDER",
      errorMessage: "Folder ID is empty or invalid.",
    };
  }

  try {
    const drive = getGoogleDriveClient();
    let currentToken: string | undefined = undefined;
    const allFiles: DriveFile[] = [];

    // Paginate through all pages until all files in the folder are retrieved
    do {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiResult: any = await drive.files.list({
        q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
        fields: "nextPageToken, files(id, name, mimeType, thumbnailLink, webContentLink, imageMediaMetadata)",
        pageSize: 1000,
        pageToken: currentToken,
        orderBy: "name",
      });

      const files = apiResult.data.files as DriveFile[] | undefined;
      if (files && files.length > 0) {
        allFiles.push(...files);
      }

      currentToken = (apiResult.data.nextPageToken as string) || undefined;
    } while (currentToken);

    if (allFiles.length === 0) {
      return {
        photos: [],
        error: "NO_IMAGES_FOUND",
        errorMessage: "No supported image files were found in this Google Drive folder.",
      };
    }

    const photos: Photo[] = allFiles.map((file) => {
      // Use permanent Google Drive thumbnail endpoint (never expires, fast, zero server overhead)
      const previewSrc = file.id
        ? `https://drive.google.com/thumbnail?id=${file.id}&sz=w1200`
        : "/icon.png";

      const width = file.imageMediaMetadata?.width || 1200;
      const height = file.imageMediaMetadata?.height || 900;
      const aspectRatio = width && height ? Number((width / height).toFixed(2)) : 1.33;

      return {
        id: file.id || `file_${Math.random()}`,
        name: file.name || "Untitled Photo.jpg",
        src: previewSrc,
        aspectRatio,
        width,
        height,
      };
    });

    return {
      photos,
    };
  } catch (err: unknown) {
    const errorObj = err as { code?: number; message?: string; errors?: Array<{ reason?: string }> };

    // Check for missing credentials error
    if (errorObj?.message?.includes("MISSING_CREDENTIALS")) {
      return {
        photos: [],
        error: "MISSING_CREDENTIALS",
        errorMessage: "Google Drive service account credentials are not configured on the server.",
      };
    }

    // Check for 404/403 inaccessible or non-existent folder
    if (errorObj?.code === 404 || errorObj?.code === 403 || errorObj?.message?.includes("not found")) {
      return {
        photos: [],
        error: "INACCESSIBLE_FOLDER",
        errorMessage:
          "Google Drive folder is inaccessible or does not exist. Please check folder permissions and share the folder with the Service Account email.",
      };
    }

    return {
      photos: [],
      error: "API_ERROR",
      errorMessage: errorObj?.message || "Failed to retrieve photos from Google Drive API.",
    };
  }
}
