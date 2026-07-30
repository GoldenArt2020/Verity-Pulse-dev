import type { StorageProvider } from "./types";

// Temporary in-memory stand-in until S3 is live (post AWS verification).
// Swap this for an s3StorageProvider.ts later without touching any calling code.
const memoryStore = new Map<string, Blob | string>();

export const mockStorageProvider: StorageProvider = {
  name: "mock",
  async upload(key, data) {
    memoryStore.set(key, data);
    return `mock://${key}`;
  },
  async getUrl(key) {
    if (!memoryStore.has(key)) throw new Error(`No file found for key: ${key}`);
    return `mock://${key}`;
  },
};