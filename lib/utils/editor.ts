import { ClientSelection, MatchedPhoto, PhotoFile, MatchStatus } from "@/lib/types/editor";

export const DEFAULT_RAW_EXTENSIONS = [
  "cr2",
  "cr3",
  "nef",
  "arw",
  "dng",
  "raf",
  "orf",
  "rw2",
  "pef",
  "3fr",
];

export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "tif", "tiff"];

/**
 * Extracts basename from filename (removes path and extension)
 * e.g., "IMG_1234.JPG" -> "IMG_1234"
 * e.g., "folder/IMG_1234.CR3" -> "IMG_1234"
 */
export function extractBasename(filename: string): string {
  const clean = filename.trim().split(/[/\\]/).pop() || filename;
  const lastDotIndex = clean.lastIndexOf(".");
  if (lastDotIndex <= 0) return clean;
  return clean.substring(0, lastDotIndex);
}

/**
 * Extracts extension from filename (lowercase without dot)
 * e.g., "IMG_1234.JPG" -> "jpg"
 */
export function extractExtension(filename: string): string {
  const clean = filename.trim().split(/[/\\]/).pop() || filename;
  const lastDotIndex = clean.lastIndexOf(".");
  if (lastDotIndex <= 0) return "";
  return clean.substring(lastDotIndex + 1).toLowerCase();
}

/**
 * Parses raw text (e.g. pasted WhatsApp message, imported TXT file) into ClientSelection list.
 * Automatically cleans numbering, boilerplate text, normalizes extensions, and removes duplicates.
 */
export function parseClientSelectionText(text: string): ClientSelection[] {
  if (!text) return [];

  const lines = text.split(/\r?\n/);
  const selections: ClientSelection[] = [];
  const seenBasenames = new Set<string>();

  const commonSkipPhrases = [
    "halo",
    "hi",
    "terima kasih",
    "thanks",
    "total",
    "foto",
    "pemilihan",
    "berikut",
    "daftar",
    "sudah",
    "memilih",
    "untuk",
    "diedit",
  ];

  for (let rawLine of lines) {
    let line = rawLine.trim();
    if (!line) continue;

    // Strip leading numbers or list symbols e.g. "1. ", "2) ", "- ", "* "
    line = line.replace(/^[0-9]+[.)]\s*/, "").replace(/^[-*•]\s*/, "").trim();

    if (!line) continue;

    // Skip lines that look like standard WhatsApp greeting or footer sentences
    const lineLower = line.toLowerCase();
    const isBoilerplate = commonSkipPhrases.some(
      (phrase) => lineLower.startsWith(phrase) || lineLower.includes("total:") || lineLower.includes("total :")
    );

    // If line has multiple words with spaces and no image/file extension, likely conversational text
    const hasExtension = /\.[a-zA-Z0-9]{2,4}$/.test(line);
    if (isBoilerplate && !hasExtension) continue;

    // Extract potential filename token if embedded in text (e.g. "Foto: IMG_1234.JPG")
    const filenameMatch = line.match(/([a-zA-Z0-9_\-\s]+\.[a-zA-Z0-9]{2,4})/);
    let targetFilename = line;
    if (filenameMatch && filenameMatch[1]) {
      targetFilename = filenameMatch[1].trim();
    }

    // Clean up filename
    const basename = extractBasename(targetFilename);
    const extension = extractExtension(targetFilename) || "jpg";

    if (!basename || basename.length < 2) continue;

    // Check duplicate by normalized lower-case basename
    const key = basename.toLowerCase();
    if (seenBasenames.has(key)) continue;

    seenBasenames.add(key);

    selections.push({
      filename: `${basename}.${extension.toUpperCase()}`,
      basename,
    });
  }

  return selections;
}

/**
 * Matches client selections against scanned local photo files.
 */
export function matchPhotos(
  selections: ClientSelection[],
  scannedFiles: PhotoFile[],
  rawExtensions: string[] = DEFAULT_RAW_EXTENSIONS
): MatchedPhoto[] {
  // Normalize raw extensions to lowercase set
  const rawSet = new Set(rawExtensions.map((e) => e.toLowerCase()));
  const imgSet = new Set(IMAGE_EXTENSIONS);

  // Group scanned files by lower-case basename
  const scannedByBasename = new Map<string, { jpg?: PhotoFile; raw?: PhotoFile }>();

  for (const file of scannedFiles) {
    const key = file.basename.toLowerCase();
    const ext = file.extension.toLowerCase();

    if (!scannedByBasename.has(key)) {
      scannedByBasename.set(key, {});
    }

    const group = scannedByBasename.get(key)!;

    if (imgSet.has(ext) && !group.jpg) {
      group.jpg = file;
    } else if (rawSet.has(ext) && !group.raw) {
      group.raw = file;
    } else if (!group.jpg && !group.raw) {
      // If extension is not explicitly listed, treat as raw if non-JPG
      group.raw = file;
    }
  }

  return selections.map((selection, idx) => {
    const key = selection.basename.toLowerCase();
    const group = scannedByBasename.get(key);

    const jpg = group?.jpg;
    const raw = group?.raw;

    let status: MatchStatus = "not-found";
    if (jpg && raw) {
      status = "ready";
    } else if (jpg && !raw) {
      status = "raw-missing";
    } else if (!jpg && raw) {
      status = "jpg-missing";
    } else {
      status = "not-found";
    }

    return {
      id: `match_${idx}_${selection.basename}`,
      selection,
      jpg,
      raw,
      status,
    };
  });
}
