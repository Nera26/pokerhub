import { writeFileSync } from 'fs';
import { join } from 'path';

const PRECACHE_URLS = ['/', '/favicon.ico'];
const manifestPath = join(process.cwd(), '.next', 'precache-manifest.json');
writeFileSync(manifestPath, JSON.stringify(PRECACHE_URLS));
