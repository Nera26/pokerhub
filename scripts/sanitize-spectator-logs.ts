#!/usr/bin/env ts-node
import { readFileSync, writeFileSync } from 'fs';

function sanitize(content: string): string {
  return content
    .replace(/(\"?userId\"?\s*[:=]\s*)(\"?)[A-Za-z0-9-]+\2/g, '$1$2<redacted>$2')
    .replace(/(\"?tableSecret\"?\s*[:=]\s*)(\"?)[A-Za-z0-9-]+\2/g, '$1$2<redacted>$2')
    .replace(/(\"?sessionToken\"?\s*[:=]\s*)(\"?)[A-Za-z0-9-]+\2/g, '$1$2<redacted>$2')
    .replace(/(\"?email\"?\s*[:=]\s*)(\"?)[^\s"'@]+@[^\s"']+\2/g, '$1$2<redacted>$2')
    .replace(/(\"?ipAddress\"?\s*[:=]\s*)(\"?)(?:\d{1,3}\.){3}\d{1,3}\2/g, '$1$2<redacted>$2');
}

export function sanitizeFiles(files: string[]): void {
  for (const file of files) {
    const data = readFileSync(file, 'utf-8');
    const sanitized = sanitize(data);
    writeFileSync(file, sanitized);
  }
}

if (typeof require !== 'undefined' && require.main === module) {
  sanitizeFiles(process.argv.slice(2));
}

export { sanitize };
