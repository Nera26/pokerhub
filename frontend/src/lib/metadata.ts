import { getBaseUrl } from './base-url';

const DEFAULT_TITLE = 'PokerHub';
const DEFAULT_DESCRIPTION =
  "Live Texas Hold'em, Omaha & Tournaments — PokerHub";
const DEFAULT_IMAGE = '/pokerhub-logo.svg';

interface BuildMetadataOptions {
  title?: string;
  description?: string;
  imagePath?: string;
  path?: string;
}

export function buildMetadata({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  imagePath = DEFAULT_IMAGE,
  path = '',
}: BuildMetadataOptions = {}) {
  const baseUrl = getBaseUrl();
  return {
    title,
    description,
    image: `${baseUrl}${imagePath}`,
    url: `${baseUrl}${path}`,
  };
}
