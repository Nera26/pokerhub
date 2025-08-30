import { registerAs } from '@nestjs/config';

export default registerAs('gcs', () => ({
  bucket: process.env.GCS_BUCKET,
  projectId: process.env.GCP_PROJECT,
  endpoint: process.env.GCS_EMULATOR_HOST,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
}));
