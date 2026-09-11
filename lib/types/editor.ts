export type PhotoFile = {
  name: string; // e.g. "IMG_1234.JPG"
  basename: string; // e.g. "IMG_1234"
  extension: string; // e.g. "jpg" (lowercase)
  relativePath?: string;
  fileHandle?: FileSystemFileHandle;
  file?: File;
};

export type ClientSelection = {
  filename: string; // e.g. "IMG_1234.JPG"
  basename: string; // e.g. "IMG_1234"
};

export type MatchStatus = "ready" | "raw-missing" | "jpg-missing" | "not-found";

export type MatchedPhoto = {
  id: string;
  selection: ClientSelection;
  jpg?: PhotoFile;
  raw?: PhotoFile;
  status: MatchStatus;
};

export type EditingJob = {
  id: string;
  name: string;
  clientName?: string;
  galleryId?: string;
  clientSelections: ClientSelection[];
  rawExtensions: string[];
  createdAt: string;
  updatedAt: string;
};

export type FolderScanProgress = {
  scannedCount: number;
  isScanning: boolean;
  totalEstimated?: number;
  currentFolder?: string;
};

export type CopyProgress = {
  copiedCount: number;
  totalCount: number;
  isCopying: boolean;
  currentFilename?: string;
  errorCount: number;
};

export type EditingSetCopyMode = "raw-preferred" | "all" | "raw-only";

