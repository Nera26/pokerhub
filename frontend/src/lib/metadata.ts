import { getBaseUrl } from './base-url';
import {
  SiteMetadataResponseSchema,
  type SiteMetadataResponse,
} from '@shared/types';

let metadataPromise: Promise<SiteMetadataResponse> | null = null;

export function getSiteMetadata(): Promise<SiteMetadataResponse> {
  if (!metadataPromise) {
    metadataPromise = fetch('/api/site-metadata').then(async (res) => {
      if (!res.ok) {
        throw new Error('Failed to fetch site metadata');
      }
      const data = await res.json();
      return SiteMetadataResponseSchema.parse(data);
    });
  }
  return metadataPromise;
}

interface BuildMetadataOptions {
  title?: string;
  description?: string;
  imagePath?: string;
  path?: string;
}

export async function buildMetadata({
  title,
  description,
  imagePath,
  path = '',
}: BuildMetadataOptions = {}) {
  const baseUrl = getBaseUrl();
  const meta = await getSiteMetadata();
  return {
    title: title ?? meta.title,
    description: description ?? meta.description,
    image: `${baseUrl}${imagePath ?? meta.imagePath}`,
    url: `${baseUrl}${path}`,
  };
}
