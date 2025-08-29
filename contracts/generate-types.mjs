import openapiTS from 'openapi-typescript';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const input = path.join(__dirname, 'openapi.yaml');
const outputDir = path.join(__dirname, 'types');
const outputFile = path.join(outputDir, 'api.d.ts');

const schema = await openapiTS(input);
await mkdir(outputDir, { recursive: true });
await writeFile(outputFile, schema);
console.log(`Generated ${outputFile}`);
