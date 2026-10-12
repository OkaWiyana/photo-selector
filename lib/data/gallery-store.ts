import { Gallery } from "@/lib/types/gallery";
import { MOCK_GALLERY } from "@/lib/data/mock-gallery";

// Global in-memory map to persist created galleries across API calls during dev runtime
const globalGalleriesStore = new Map<string, Gallery>();

export interface InStoreSelection {
  selectedFilenames: string[];
  updatedAt: string;
}

const globalSelectionsStore = new Map<string, InStoreSelection>();

// Pre-populate with default demo gallery
globalGalleriesStore.set(MOCK_GALLERY.id, MOCK_GALLERY);
globalSelectionsStore.set("demo", {
  selectedFilenames: [
    "IMG_4821.jpg",
    "IMG_4825.jpg",
    "IMG_4840.jpg",
    "IMG_4870.jpg",
    "IMG_4890.jpg",
  ],
  updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
});

export function saveGalleryToStore(gallery: Gallery): void {
  globalGalleriesStore.set(gallery.id, gallery);
}

export function getGalleryFromStore(id: string): Gallery | undefined {
  return globalGalleriesStore.get(id);
}

export function getAllGalleriesFromStore(): Gallery[] {
  return Array.from(globalGalleriesStore.values());
}

export function saveSelectionToStore(galleryId: string, selectedFilenames: string[]): void {
  globalSelectionsStore.set(galleryId, {
    selectedFilenames,
    updatedAt: new Date().toISOString(),
  });
}

export function getSelectionFromStore(galleryId: string): InStoreSelection | undefined {
  return globalSelectionsStore.get(galleryId);
}

export function getAllSelectionsFromStore(): Map<string, InStoreSelection> {
  return new Map(globalSelectionsStore);
}

export function deleteGalleryFromStore(id: string): void {
  globalGalleriesStore.delete(id);
  globalSelectionsStore.delete(id);
}

export function updateGalleryInStore(id: string, updates: Partial<Gallery>): boolean {
  const existing = globalGalleriesStore.get(id);
  if (!existing) return false;
  globalGalleriesStore.set(id, {
    ...existing,
    ...updates,
    clientName: updates.clientName !== undefined ? updates.clientName : existing.clientName,
    title: updates.clientName ? `${updates.clientName} Photo Proofing` : existing.title,
  });
  return true;
}
