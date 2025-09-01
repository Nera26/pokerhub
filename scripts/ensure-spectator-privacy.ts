#!/usr/bin/env ts-node
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

function main() {
  const workflowsDir = join(process.cwd(), '.github', 'workflows');
  const files = readdirSync(workflowsDir).filter((f) => f.endsWith('.yml'));
  const missing: string[] = [];

  for (const file of files) {
    if (file === 'spectator-privacy.yml') continue;
    const content = readFileSync(join(workflowsDir, file), 'utf-8');
    if (!content.includes('uses: ./.github/workflows/spectator-privacy.yml')) {
      missing.push(file);
    }
  }

  if (missing.length > 0) {
    console.error(
      `Missing spectator-privacy job in: ${missing.join(', ')}`,
    );
    process.exit(1);
  }
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
