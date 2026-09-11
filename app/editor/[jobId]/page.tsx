import { Metadata } from "next";
import { EditorWorkspaceContainer } from "@/components/editor/EditorWorkspaceContainer";

export const metadata: Metadata = {
  title: "Editor Workspace Job | Kala Archives Photo Selector",
  description: "Match client photo selections with local JPG + RAW files on disk.",
};

export default function EditorJobPage() {
  return <EditorWorkspaceContainer />;
}
