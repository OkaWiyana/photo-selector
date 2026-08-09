import { notFound } from "next/navigation";
import { getGalleryWithPhotos } from "@/lib/services/gallery-service";
import { GalleryContainer } from "@/components/gallery/GalleryContainer";
import { GalleryErrorState } from "@/components/gallery/GalleryErrorState";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const { gallery } = await getGalleryWithPhotos(id);

  if (!gallery) {
    return {
      title: "Gallery Not Found",
    };
  }

  return {
    title: `${gallery.title} | ${gallery.clientName} Proofing`,
    description: `Select up to ${gallery.maxSelections} photos for editing.`,
  };
}

export default async function GalleryPage({ params }: PageProps) {
  const { id } = await params;
  const { gallery, error, errorMessage } = await getGalleryWithPhotos(id);

  if (!gallery && error === "NOT_FOUND") {
    notFound();
  }

  // Handle Google Drive error states
  if (error && error !== "MISSING_CREDENTIALS") {
    return (
      <GalleryErrorState
        type={error}
        message={errorMessage}
        serviceAccountEmail={process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}
      />
    );
  }

  if (!gallery) {
    notFound();
  }

  return <GalleryContainer gallery={gallery} />;
}
