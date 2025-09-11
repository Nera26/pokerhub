import { getBaseUrl } from './base-url';

const DEFAULT_TITLE = 'PokerHub';
const DEFAULT_DESCRIPTION =
  "Live Texas Hold'em, Omaha & Tournaments — PokerHub";
const DEFAULT_IMAGE = '/pokerhub-logo.svg';

interface SiteMetadata {
  title: string;
  description: string;
  imagePath: string;
}

let metadataPromise: Promise<SiteMetadata> | null = null;

async function getSiteMetadata(): Promise<SiteMetadata> {
  if (!metadataPromise) {
    metadataPromise = fetch('/api/site-metadata')
      .then(async (res) => {
        if (res.ok) {
          return (await res.json()) as SiteMetadata;
        }
        throw new Error('Failed to fetch');
      })
      .catch(() => ({
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        imagePath: DEFAULT_IMAGE,
      }));
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
