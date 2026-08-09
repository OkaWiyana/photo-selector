export interface Photo {
  id: string;
  name: string;
  src: string;
  aspectRatio?: number;
  width?: number;
  height?: number;
}

export interface Gallery {
  id: string;
  title: string;
  clientName: string;
  driveFolderId: string;
  maxSelections: number;
  whatsappNumber: string;
  photos: Photo[];
  createdAt?: string;
}

export interface SupabaseGalleryRow {
  id: string;
  client_name: string;
  drive_folder_id: string;
  max_selections: number;
  whatsapp_number: string;
  created_at?: string;
}

export interface CreateGalleryInput {
  clientName: string;
  driveUrl: string;
  maxSelections: number;
  whatsappNumber: string;
}

export interface CreateGalleryResult {
  success: boolean;
  errors?: {
    clientName?: string;
    driveUrl?: string;
    maxSelections?: string;
    whatsappNumber?: string;
    form?: string;
  };
  galleryId?: string;
  galleryUrl?: string;
}

export interface WhatsAppMessageParams {
  phone: string;
  clientName?: string;
  selectedPhotos: Photo[];
}
