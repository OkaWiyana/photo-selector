import { EditingJob } from "@/lib/types/editor";
import { DEFAULT_RAW_EXTENSIONS } from "@/lib/utils/editor";

const JOBS_STORAGE_KEY = "kala_photo_selector_editor_jobs";
const RAW_EXT_STORAGE_KEY = "kala_photo_selector_raw_extensions";

/**
 * Gets all saved EditingJobs from client browser localStorage.
 */
export function getSavedJobs(): EditingJob[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(JOBS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as EditingJob[];
  } catch (err) {
    console.warn("Failed loading jobs from localStorage:", err);
    return [];
  }
}

/**
 * Gets a specific EditingJob by ID.
 */
export function getJobById(id: string): EditingJob | null {
  const jobs = getSavedJobs();
  return jobs.find((j) => j.id === id) || null;
}

/**
 * Saves or updates an EditingJob in localStorage.
 */
export function saveJobToStorage(job: EditingJob): void {
  if (typeof window === "undefined") return;

  try {
    const jobs = getSavedJobs();
    const existingIdx = jobs.findIndex((j) => j.id === job.id);

    if (existingIdx !== -1) {
      jobs[existingIdx] = {
        ...job,
        updatedAt: new Date().toISOString(),
      };
    } else {
      jobs.unshift(job);
    }

    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
  } catch (err) {
    console.warn("Failed saving job to localStorage:", err);
  }
}

/**
 * Deletes an EditingJob from localStorage.
 */
export function deleteJobFromStorage(id: string): void {
  if (typeof window === "undefined") return;

  try {
    const jobs = getSavedJobs().filter((j) => j.id !== id);
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
  } catch (err) {
    console.warn("Failed deleting job from localStorage:", err);
  }
}

/**
 * Retrieves custom RAW extensions or defaults.
 */
export function getSavedRawExtensions(): string[] {
  if (typeof window === "undefined") return DEFAULT_RAW_EXTENSIONS;

  try {
    const raw = localStorage.getItem(RAW_EXT_STORAGE_KEY);
    if (!raw) return DEFAULT_RAW_EXTENSIONS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // fallback to defaults
  }
  return DEFAULT_RAW_EXTENSIONS;
}

/**
 * Saves custom RAW extensions setting to localStorage.
 */
export function saveRawExtensionsToStorage(extensions: string[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(RAW_EXT_STORAGE_KEY, JSON.stringify(extensions));
  } catch (err) {
    console.warn("Failed saving RAW extensions to localStorage:", err);
  }
}
