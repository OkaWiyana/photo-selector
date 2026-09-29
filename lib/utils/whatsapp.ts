import { Photo, WhatsAppMessageParams } from "@/lib/types/gallery";

/**
 * Sanitizes phone numbers into a standard international digit-only string for wa.me URL
 * Example: "+62 812-3456-789" => "628123456789"
 */
export function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Formats phone numbers for WhatsApp deep links.
 * Converts local Indonesian numbers starting with "0" into "62..."
 * Example: "08123456789" => "628123456789"
 */
export function formatPhoneNumberForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }
  return digits;
}

/**
 * Generates formatted text message for WhatsApp selection submission.
 */
export function formatWhatsAppMessage(
  selectedPhotos: Photo[],
  clientName?: string,
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
 * Constructs a WhatsApp deep link URL for client selections submission.
 * Uses api.whatsapp.com directly to avoid wa.me HTTP 302 redirect UTF-8 emoji corruption on desktop browsers.
 */
export function generateWhatsAppLink({
  phone,
  clientName,
  selectedPhotos,
}: WhatsAppMessageParams): string {
  const cleanPhone = formatPhoneNumberForWhatsApp(phone);
  const rawMessage = formatWhatsAppMessage(selectedPhotos, clientName);
  const encodedMessage = encodeURIComponent(rawMessage);

  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;
}

export interface ClientChatTemplateParams {
  driveUrl: string;
  galleryUrl: string;
}

/**
 * Generates client invitation chat template text for WhatsApp.
 */
export function formatClientInvitationMessage({
  driveUrl,
  galleryUrl,
}: ClientChatTemplateParams): string {
  return `Halo Kak! Foto-foto sudah beres aku proses yaa. 🙌✨

Semua file dan proses pemilihan foto sekarang bisa Kakak akses langsung lewat link di bawah ini:

📁 *Link Download All Files (Original):*
${driveUrl}

_(Disarankan segera didownload ya Kak, batas penyimpanan aman 30 hari)_

📸 *Link Portal Pemilihan Foto Edit:*
${galleryUrl}

Untuk pemilihan foto editan, Kakak tinggal masuk ke link portal di atas, klik untuk memilih foto favoritnya yang akan di edit, lalu klik *'Send Selection'*. Nanti webnya bakal otomatis buatin template chat ke WA ini.
Selamat memilih Kak! 😉`;
}

/**
 * Constructs WhatsApp deep link to send invitation template directly to client's WhatsApp number.
 * Uses api.whatsapp.com directly to preserve UTF-8 emojis on WhatsApp Web.
 */
export function generateClientWhatsAppLink(
  phone: string,
  params: ClientChatTemplateParams,
): string {
  const cleanPhone = formatPhoneNumberForWhatsApp(phone);
  const rawMessage = formatClientInvitationMessage(params);
  const encodedMessage = encodeURIComponent(rawMessage);

  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;
}
