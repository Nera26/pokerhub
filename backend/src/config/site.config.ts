import { registerAs } from '@nestjs/config';

export default registerAs('site', () => ({
  title: process.env.SITE_TITLE ?? 'PokerHub',
  description:
    process.env.SITE_DESCRIPTION ??
    "Live Texas Hold'em, Omaha & Tournaments — PokerHub",
  imagePath: process.env.SITE_IMAGE_PATH ?? '/pokerhub-logo.svg',
}));
