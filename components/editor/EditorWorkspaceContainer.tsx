"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ClientSelection,
  EditingJob,
  MatchedPhoto,
  PhotoFile,
} from "@/lib/types/editor";
import { matchPhotos, parseClientSelectionText } from "@/lib/utils/editor";
import {
  getSavedJobs,
  saveJobToStorage,
  deleteJobFromStorage,
  getSavedRawExtensions,
  saveRawExtensionsToStorage,
} from "@/lib/services/editor-storage-service";
import { EditorHeader } from "./EditorHeader";
import { ImportSelectionSection } from "./ImportSelectionSection";
import { FolderSelectorSection } from "./FolderSelectorSection";
import { ResultTableSection } from "./ResultTableSection";
import { CreateSetModal } from "./CreateSetModal";
import { JobManagerModal } from "./JobManagerModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface EditorWorkspaceContainerProps {
  initialGalleryData?: {
    galleryId: string;
    clientName: string;
    galleryTitle: string;
    selectedFilenames: string[];
  } | null;
}

export function EditorWorkspaceContainer({
  initialGalleryData,
}: EditorWorkspaceContainerProps) {
  // Saved Jobs State
  const [jobs, setJobs] = useState<EditingJob[]>([]);
  const [currentJob, setCurrentJob] = useState<EditingJob>({
    id: `job_${Date.now()}`,
    name: initialGalleryData?.clientName
      ? `${initialGalleryData.clientName} Edit Set`
      : "New Editing Job",
    clientName: initialGalleryData?.clientName,
    galleryId: initialGalleryData?.galleryId,
    clientSelections: initialGalleryData?.selectedFilenames
      ? initialGalleryData.selectedFilenames.map((name) => ({
          filename: name,
          basename: name.substring(0, name.lastIndexOf(".")) || name,
        }))
      : [],
    rawExtensions: getSavedRawExtensions(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Local File Scanner State
  const [scannedFiles, setScannedFiles] = useState<PhotoFile[]>([]);
  const [scannedFolderName, setScannedFolderName] = useState<string>("");
  const [rootDirectoryHandle, setRootDirectoryHandle] = useState<FileSystemDirectoryHandle | undefined>();

  // Modals
  const [showCreateSetModal, setShowCreateSetModal] = useState<boolean>(false);
  const [showJobManagerModal, setShowJobManagerModal] = useState<boolean>(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);

  // Load saved jobs & RAW extensions on mount
  useEffect(() => {
    const saved = getSavedJobs();
    setJobs(saved);
    const exts = getSavedRawExtensions();
    setCurrentJob((prev) => ({ ...prev, rawExtensions: exts }));
  }, []);

  // Update initial gallery selection if passed via server props
  useEffect(() => {
    if (initialGalleryData && initialGalleryData.selectedFilenames.length > 0) {
      const selections = parseClientSelectionText(
        initialGalleryData.selectedFilenames.join("\n")
      );
      setCurrentJob((prev) => ({
        ...prev,
        clientName: initialGalleryData.clientName,
        galleryId: initialGalleryData.galleryId,
        name: `${initialGalleryData.clientName} Proofing Set`,
        clientSelections: selections,
      }));
    }
  }, [initialGalleryData]);

  // Compute matched photos memoized
  const matchedPhotos: MatchedPhoto[] = useMemo(() => {
    return matchPhotos(
      currentJob.clientSelections,
      scannedFiles,
      currentJob.rawExtensions
    );
  }, [currentJob.clientSelections, scannedFiles, currentJob.rawExtensions]);

  // Actions
  const handleUpdateJobName = (name: string) => {
    const updated = { ...currentJob, name, updatedAt: new Date().toISOString() };
    setCurrentJob(updated);
    saveJobToStorage(updated);
    setJobs(getSavedJobs());
  };

  const handleUpdateSelections = (selections: ClientSelection[]) => {
    const updated = {
      ...currentJob,
      clientSelections: selections,
      updatedAt: new Date().toISOString(),
    };
    setCurrentJob(updated);
    saveJobToStorage(updated);
    setJobs(getSavedJobs());
  };

  const handleUpdateRawExtensions = (rawExtensions: string[]) => {
    saveRawExtensionsToStorage(rawExtensions);
    const updated = { ...currentJob, rawExtensions, updatedAt: new Date().toISOString() };
    setCurrentJob(updated);
    saveJobToStorage(updated);
  };

  const handleFilesScanned = (
    files: PhotoFile[],
    folderName: string,
    dirHandle?: FileSystemDirectoryHandle
  ) => {
    setScannedFiles(files);
    setScannedFolderName(folderName);
    setRootDirectoryHandle(dirHandle);
  };

  const handleSelectJob = (job: EditingJob) => {
    setCurrentJob(job);
  };

  const handleCreateNewJob = (name: string) => {
    const newJob: EditingJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      clientSelections: [],
      rawExtensions: currentJob.rawExtensions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCurrentJob(newJob);
    saveJobToStorage(newJob);
    setJobs(getSavedJobs());
  };

  const handleDeleteJob = (id: string) => {
    deleteJobFromStorage(id);
    const updatedJobs = getSavedJobs();
    setJobs(updatedJobs);
    if (currentJob.id === id) {
      if (updatedJobs.length > 0) {
        setCurrentJob(updatedJobs[0]);
      } else {
        handleCreateNewJob("Default Job");
      }
    }
  };

  const handleConfirmReset = () => {
    const resetJob: EditingJob = {
      ...currentJob,
      clientSelections: [],
      updatedAt: new Date().toISOString(),
    };
    setCurrentJob(resetJob);
    setScannedFiles([]);
    setScannedFolderName("");
    setRootDirectoryHandle(undefined);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Editor Top Navigation Header */}
      <EditorHeader
        currentJob={currentJob}
        onUpdateJobName={handleUpdateJobName}
        onOpenJobManager={() => setShowJobManagerModal(true)}
        onResetWorkspace={() => setShowResetConfirmModal(true)}
        savedJobsCount={jobs.length}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Section 1: Import Client Selection */}
        <ImportSelectionSection
          selections={currentJob.clientSelections}
          onUpdateSelections={handleUpdateSelections}
          galleryInfo={{
            clientName: currentJob.clientName,
            title: currentJob.name,
          }}
        />

        {/* Section 2 & 3: Select Local Photo Folder */}
        <FolderSelectorSection
          scannedFiles={scannedFiles}
          scannedFolderName={scannedFolderName}
          onFilesScanned={handleFilesScanned}
          rawExtensions={currentJob.rawExtensions}
          onUpdateRawExtensions={handleUpdateRawExtensions}
        />

        {/* Section 4 & 5: Result Table & Create Editing Set */}
        <ResultTableSection
          matchedPhotos={matchedPhotos}
          onOpenCreateSetModal={() => setShowCreateSetModal(true)}
          hasScannedFolder={scannedFiles.length > 0 || Boolean(rootDirectoryHandle)}
        />
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-zinc-600 font-mono py-6 border-t border-zinc-900">
        Kala Archives • Photo Selector Editor Workspace
      </footer>

      {/* Create Set Modal */}
      {showCreateSetModal && (
        <CreateSetModal
          matchedPhotos={matchedPhotos}
          rootHandle={rootDirectoryHandle}
          onClose={() => setShowCreateSetModal(false)}
        />
      )}

      {/* Job Manager Modal */}
      {showJobManagerModal && (
        <JobManagerModal
          jobs={jobs}
          currentJobId={currentJob.id}
          onSelectJob={handleSelectJob}
          onCreateNewJob={handleCreateNewJob}
          onDeleteJob={handleDeleteJob}
          onClose={() => setShowJobManagerModal(false)}
        />
      )}

      {/* Custom Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirmModal}
        title="Reset Workspace?"
        message="Apakah Anda yakin ingin mengosongkan daftar pilihan client dan hasil scan folder lokal? Data job ini akan di-reset."
        confirmText="Ya, Reset Workspace"
        cancelText="Batal"
        variant="warning"
        onConfirm={handleConfirmReset}
        onClose={() => setShowResetConfirmModal(false)}
      />
    </div>
  );
}
