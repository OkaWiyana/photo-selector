import { Photo, WhatsAppMessageParams } from "@/lib/types/gallery";

/**
 * Sanitizes phone numbers into a standard international digit-only string for wa.me URL
 * Example: "+62 812-3456-789" => "628123456789"
 */
export function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Generates formatted text message for WhatsApp selection submission.
 */
export function formatWhatsAppMessage(
  selectedPhotos: Photo[],
  clientName?: string
): string {
  const photoListText = selectedPhotos
    .map((photo, index) => `${index + 1}. ${photo.name}`)
    .join("\n");

  const totalCount = selectedPhotos.length;

  const header = clientName
    ? `Halo Kak, saya (${clientName}) sudah memilih foto untuk diedit.`
    : `Halo Kak, saya sudah memilih foto untuk diedit.`;

  return `${header}\n\n${photoListText}\n\nTotal: ${totalCount} foto.`;
}

/**
 * Constructs a wa.me WhatsApp deep link URL.
 */
export function generateWhatsAppLink({
  phone,
  clientName,
  selectedPhotos,
}: WhatsAppMessageParams): string {
  const cleanPhone = sanitizePhoneNumber(phone);
  const rawMessage = formatWhatsAppMessage(selectedPhotos, clientName);
  const encodedMessage = encodeURIComponent(rawMessage);

  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
