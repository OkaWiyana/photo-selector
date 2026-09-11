import { Metadata } from "next";
import { getGallerySelection } from "@/lib/services/gallery-service";
import { EditorWorkspaceContainer } from "@/components/editor/EditorWorkspaceContainer";

export const metadata: Metadata = {
  title: "Editor Workspace | Kala Archives Photo Selector",
  description: "Match client photo selections with local JPG + RAW files on disk.",
};

interface PageProps {
  searchParams: Promise<{
    gallery?: string;
  }>;
}

export default async function EditorPage({ searchParams }: PageProps) {
  const { gallery: galleryId } = await searchParams;

  let initialGalleryData = null;

  if (galleryId) {
    const galleryData = await getGallerySelection(galleryId);
    if (galleryData) {
      initialGalleryData = {
        galleryId,
        clientName: galleryData.clientName,
        galleryTitle: galleryData.galleryTitle,
        selectedFilenames: galleryData.selectedFilenames,
      };
    }
  }

  return <EditorWorkspaceContainer initialGalleryData={initialGalleryData} />;
}
