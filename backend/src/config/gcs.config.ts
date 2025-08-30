import { registerAs } from '@nestjs/config';

export default registerAs('gcs', () => ({
  projectId: process.env.GCS_PROJECT_ID,
  keyFilename: process.env.GCS_KEY_FILENAME,
  bucket: process.env.GCS_BUCKET,
}));
