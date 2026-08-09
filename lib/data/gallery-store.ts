import { Gallery } from "@/lib/types/gallery";
import { MOCK_GALLERY } from "@/lib/data/mock-gallery";

// Global in-memory map to persist created galleries across API calls during dev runtime
const globalGalleriesStore = new Map<string, Gallery>();

// Pre-populate with default demo gallery
globalGalleriesStore.set(MOCK_GALLERY.id, MOCK_GALLERY);

export function saveGalleryToStore(gallery: Gallery): void {
  globalGalleriesStore.set(gallery.id, gallery);
}

export function getGalleryFromStore(id: string): Gallery | undefined {
  return globalGalleriesStore.get(id);
}

export function getAllGalleriesFromStore(): Gallery[] {
  return Array.from(globalGalleriesStore.values());
}
