import { PhotoFile, FolderScanProgress, MatchedPhoto, EditingSetCopyMode } from "@/lib/types/editor";
import { extractBasename, extractExtension } from "@/lib/utils/editor";


/**
 * Checks if browser supports native File System Access API
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== "undefined" && typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker === "function";
}

/**
 * Recursively scans a FileSystemDirectoryHandle (File System Access API)
 */
export async function scanDirectoryHandle(
  dirHandle: FileSystemDirectoryHandle,
  onProgress?: (progress: FolderScanProgress) => void
): Promise<{ files: PhotoFile[]; folderName: string; dirHandle: FileSystemDirectoryHandle }> {
  const files: PhotoFile[] = [];
  let scannedCount = 0;

  async function traverse(handle: FileSystemDirectoryHandle, pathPrefix: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for await (const entry of (handle as any).values()) {
      if (entry.kind === "file") {
        const fileHandle = entry as FileSystemFileHandle;
        const name = fileHandle.name;
        const basename = extractBasename(name);
        const extension = extractExtension(name);

        files.push({
          name,
          basename,
          extension,
          relativePath: `${pathPrefix}${name}`,
          fileHandle,
        });

        scannedCount++;
        if (scannedCount % 50 === 0 && onProgress) {
          onProgress({
            scannedCount,
            isScanning: true,
            currentFolder: handle.name,
          });
          // Yield to main thread to prevent UI freezing
          await new Promise((res) => setTimeout(res, 0));
        }
      } else if (entry.kind === "directory") {
        // Skip hidden folders or output _EDIT directory to prevent scanning copied files
        if (entry.name.startsWith(".") || entry.name.toUpperCase() === "_EDIT" || entry.name.toUpperCase() === "EDITING") {
          continue;
        }
        await traverse(entry as FileSystemDirectoryHandle, `${pathPrefix}${entry.name}/`);
      }
    }
  }

  await traverse(dirHandle, "");

  if (onProgress) {
    onProgress({
      scannedCount: files.length,
      isScanning: false,
      currentFolder: dirHandle.name,
    });
  }

  return { files, folderName: dirHandle.name, dirHandle };
}

/**
 * Fallback scanner for HTML <input type="file" webkitdirectory>
 */
export async function scanFileList(
  fileList: FileList,
  onProgress?: (progress: FolderScanProgress) => void
): Promise<{ files: PhotoFile[]; folderName: string }> {
  const files: PhotoFile[] = [];
  const total = fileList.length;
  let folderName = "Local Folder";

  for (let i = 0; i < total; i++) {
    const file = fileList[i];
    const relativePath = file.webkitRelativePath || file.name;

    if (!folderName && relativePath.includes("/")) {
      folderName = relativePath.split("/")[0];
    }

    // Skip hidden folders or _EDIT directory
    if (relativePath.includes("/.") || relativePath.toUpperCase().includes("/_EDIT/") || relativePath.toUpperCase().includes("/EDITING/")) {
      continue;
    }

    const name = file.name;
    const basename = extractBasename(name);
    const extension = extractExtension(name);

    files.push({
      name,
      basename,
      extension,
      relativePath,
      file,
    });

    if ((i + 1) % 100 === 0 && onProgress) {
      onProgress({
        scannedCount: i + 1,
        totalEstimated: total,
        isScanning: true,
        currentFolder: folderName,
      });
      await new Promise((res) => setTimeout(res, 0));
    }
  }

  if (onProgress) {
    onProgress({
      scannedCount: files.length,
      totalEstimated: total,
      isScanning: false,
      currentFolder: folderName,
    });
  }

  return { files, folderName };
}

/**
 * Copies matched JPG + RAW files into an '_EDIT' folder inside the selected root directory handle.
 * Supports flexible copy modes:
 * - 'raw-preferred': Copies RAW if available; falls back to JPG if RAW is missing.
 * - 'all': Copies both RAW and JPG for all matched items.
 * - 'raw-only': Copies only RAW files.
 * Strictly performs COPY, never MOVE or DELETE.
 */
export async function copyEditingSetFiles(
  matchedPhotos: MatchedPhoto[],
  rootHandle: FileSystemDirectoryHandle,
  folderName: string = "_EDIT",
  copyMode: EditingSetCopyMode = "raw-preferred",
  onProgress?: (copied: number, total: number, currentName: string) => void
): Promise<{ copiedCount: number; errorCount: number }> {
  let copiedCount = 0;
  let errorCount = 0;

  const filesToCopy: PhotoFile[] = [];

  for (const match of matchedPhotos) {
    if (copyMode === "all") {
      if (match.jpg?.fileHandle || match.jpg?.file) filesToCopy.push(match.jpg);
      if (match.raw?.fileHandle || match.raw?.file) filesToCopy.push(match.raw);
    } else if (copyMode === "raw-preferred") {
      if (match.raw?.fileHandle || match.raw?.file) {
        filesToCopy.push(match.raw);
      } else if (match.jpg?.fileHandle || match.jpg?.file) {
        // Fallback to JPG if RAW is missing
        filesToCopy.push(match.jpg);
      }
    } else if (copyMode === "raw-only") {
      if (match.raw?.fileHandle || match.raw?.file) {
        filesToCopy.push(match.raw);
      }
    }
  }


  const total = filesToCopy.length;
  if (total === 0) return { copiedCount: 0, errorCount: 0 };

  // Create or get target subdirectory handle
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const targetDirHandle = await (rootHandle as any).getDirectoryHandle(folderName, { create: true });

  for (let i = 0; i < filesToCopy.length; i++) {
    const photoFile = filesToCopy[i];

    if (onProgress) {
      onProgress(copiedCount, total, photoFile.name);
    }

    try {
      if (photoFile.fileHandle) {
        // Read file contents from source FileHandle
        const fileData = await photoFile.fileHandle.getFile();
        // Create file handle in target directory
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const destHandle = await (targetDirHandle as any).getFileHandle(photoFile.name, { create: true });
        const writable = await destHandle.createWritable();
        await writable.write(fileData);
        await writable.close();
        copiedCount++;
      } else {
        errorCount++;
      }
    } catch (err) {
      console.error(`Failed copying ${photoFile.name}:`, err);
      errorCount++;
    }

    // Yield control briefly to ensure modal progress bar updates
    if (i % 2 === 0) {
      await new Promise((res) => setTimeout(res, 10));
    }
  }

  if (onProgress) {
    onProgress(copiedCount, total, "Done");
  }

  return { copiedCount, errorCount };
}
