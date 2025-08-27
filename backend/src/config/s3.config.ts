import { registerAs } from '@nestjs/config';

export default registerAs('s3', () => ({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT,
  bucket: process.env.AWS_S3_BUCKET,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
}));
