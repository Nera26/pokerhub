import { registerAs } from '@nestjs/config';

export default registerAs('gcp', () => ({
  projectId: process.env.GCP_PROJECT_ID,
  bucket: process.env.GCS_BUCKET,
  clientEmail: process.env.GCP_CLIENT_EMAIL,
  privateKey: process.env.GCP_PRIVATE_KEY,
  endpoint: process.env.GCS_ENDPOINT,
}));
