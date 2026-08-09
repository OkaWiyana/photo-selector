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

  return await createGalleryConfig({
    clientName,
    driveUrl,
    maxSelections: Number(maxSelections),
    whatsappNumber,
  });
}
