const fs = require('node:fs');
const path = require('node:path');

const distDir = path.join(__dirname, '..', 'dist');
const candidateCompiledMains = [
  path.join(distDir, 'backend', 'src', 'main.js'),
  path.join(distDir, 'src', 'main.js'),
];
const outputMain = path.join(distDir, 'main.js');
const allowMissing = process.argv.includes('--allow-missing');

const existingCompiledMain = candidateCompiledMains.find((candidate) => fs.existsSync(candidate));

if (!existingCompiledMain) {
  if (allowMissing) {
    console.warn(
      `Compiled entry point was not found yet in any of: ${candidateCompiledMains
        .map((candidate) => `"${candidate}"`)
        .join(', ')}. Continuing and assuming the watcher will emit it shortly...`,
    );
  } else {
    console.error(
      `Expected compiled entry point in one of: ${candidateCompiledMains
        .map((candidate) => `"${candidate}"`)
        .join(', ')}. Did the Nest build succeed?`,
    );
    process.exit(1);
  }
}

const relativeRequirePaths = candidateCompiledMains.map((candidate) =>
  path.relative(path.dirname(outputMain), candidate).replace(/\\\\/g, '/'),
);

const waitForCompiledMain = allowMissing
  ? `const fs = require("node:fs");\n` +
    `const path = require("node:path");\n` +
    `const candidateRequirePaths = ${JSON.stringify(relativeRequirePaths)}.map((candidate) => path.join(__dirname, candidate));\n` +
    `let compiledMain = candidateRequirePaths.find((candidate) => fs.existsSync(candidate));\n` +
    `if (!compiledMain) {\n` +
    `  const timeoutMs = parseInt(process.env.POKERHUB_COMPILED_MAIN_TIMEOUT_MS ?? "30000", 10);\n` +
    `  const start = Date.now();\n` +
    `  while (!compiledMain) {\n` +
    `    for (const candidate of candidateRequirePaths) {\n` +
    `      if (fs.existsSync(candidate)) {\n` +
    `        compiledMain = candidate;\n` +
    `        break;\n` +
    `      }\n` +
    `    }\n` +
    `    if (compiledMain) {\n` +
    `      break;\n` +
    `    }\n` +
    `    if (Date.now() - start > timeoutMs) {\n` +
    `      throw new Error(\"Timed out waiting for compiled entry point at one of: ${candidateCompiledMains
        .map((candidate) => candidate.replace(/"/g, '\\"'))
        .join(', ')}\");\n` +
    `    }\n` +
    `    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);\n` +
    `  }\n` +
    `}\n`
  : `const fs = require("node:fs");\n` +
    `const path = require("node:path");\n` +
    `const candidateRequirePaths = ${JSON.stringify(relativeRequirePaths)}.map((candidate) => path.join(__dirname, candidate));\n` +
    `const compiledMain = candidateRequirePaths.find((candidate) => fs.existsSync(candidate));\n` +
    `if (!compiledMain) {\n` +
    `  throw new Error(\"Expected compiled entry point in one of: ${candidateCompiledMains
        .map((candidate) => candidate.replace(/"/g, '\\"'))
        .join(', ')}\");\n` +
    `}\n`;

const bootstrapStub =
  `const sdkMetrics = require("@opentelemetry/sdk-metrics");\n` +
  `if (!sdkMetrics.AggregationType) {\n` +
  `  sdkMetrics.AggregationType = Object.freeze({ DEFAULT: "DEFAULT" });\n` +
  `}\n` +
  waitForCompiledMain +
  `module.exports = require(compiledMain);\n`;

fs.mkdirSync(path.dirname(outputMain), { recursive: true });
fs.writeFileSync(outputMain, bootstrapStub);
