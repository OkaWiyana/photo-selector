"use server";

import { createGalleryConfig } from "@/lib/services/gallery-service";
import { CreateGalleryResult } from "@/lib/types/gallery";

export async function createGalleryAction(
  prevState: CreateGalleryResult | null,
  formData: FormData
): Promise<CreateGalleryResult> {
  const clientName = formData.get("clientName") as string;
  const driveUrl = formData.get("driveUrl") as string;
  const maxSelections = formData.get("maxSelections") as string;
  const whatsappNumber = formData.get("whatsappNumber") as string;
  const clientWhatsappNumber = formData.get("clientWhatsappNumber") as string;

  return await createGalleryConfig({
    clientName,
    driveUrl,
    maxSelections: Number(maxSelections),
    whatsappNumber,
    clientWhatsappNumber,
  });
}

export async function saveGallerySelectionAction(
  galleryId: string,
  selectedFilenames: string[]
): Promise<boolean> {
  const { saveGallerySelection } = await import("@/lib/services/gallery-service");
  return await saveGallerySelection(galleryId, selectedFilenames);
}

export async function fetchGalleriesWithSelectionsAction() {
  const { getAllGalleriesWithSelections } = await import("@/lib/services/gallery-service");
  return await getAllGalleriesWithSelections();
}

export async function getGallerySelectionAction(galleryId: string) {
  const { getGallerySelection } = await import("@/lib/services/gallery-service");
  return await getGallerySelection(galleryId);
}



