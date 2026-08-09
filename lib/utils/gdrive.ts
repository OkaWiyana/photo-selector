/**
 * Extracts Google Drive Folder ID from various Google Drive folder URL formats.
 *
 * Supported formats:
 * - https://drive.google.com/drive/folders/1A2B3C4D5E6F7G8H9I0J
 * - https://drive.google.com/drive/u/0/folders/1A2B3C4D5E6F7G8H9I0J
 * - https://drive.google.com/open?id=1A2B3C4D5E6F7G8H9I0J
 * - https://drive.google.com/folderview?id=1A2B3C4D5E6F7G8H9I0J
 * - Raw Folder ID string (e.g. 1A2B3C4D5E6F7G8H9I0J)
 */
export function extractDriveFolderId(url: string): string | null {
  if (!url || typeof url !== "string") return null;

  const trimmed = url.trim();

  // Check if input is already a raw folder ID
  if (/^[a-zA-Z0-9_-]{10,64}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsedUrl = new URL(trimmed);
    if (!parsedUrl.hostname.includes("drive.google.com")) {
      return null;
    }

    // Path pattern: /drive/folders/ID or /drive/u/0/folders/ID
    const folderMatch = parsedUrl.pathname.match(/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch && folderMatch[1]) {
      return folderMatch[1];
    }

    // Query parameter pattern: ?id=ID
    const idParam = parsedUrl.searchParams.get("id");
    if (idParam && /^[a-zA-Z0-9_-]{10,64}$/.test(idParam)) {
      return idParam;
    }
  } catch {
    return null;
  }

  return null;
}
