import { Storage } from '@google-cloud/storage';

let storage: Storage | undefined;

export function getGcsClient(): Storage {
  if (!storage) {
    storage = new Storage({ projectId: process.env.GCS_PROJECT_ID });
  }
  return storage;
}
