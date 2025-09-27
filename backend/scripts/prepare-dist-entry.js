const fs = require('node:fs');
const path = require('node:path');

const distDir = path.join(__dirname, '..', 'dist');
const compiledMain = path.join(distDir, 'backend', 'src', 'main.js');
const outputMain = path.join(distDir, 'main.js');
const allowMissing = process.argv.includes('--allow-missing');

if (!fs.existsSync(compiledMain)) {
  if (allowMissing) {
    console.warn(
      `Compiled entry point "${compiledMain}" was not found yet. Continuing and assuming the watcher will emit it shortly...`,
    );
  } else {
    console.error(
      `Expected compiled entry point at "${compiledMain}" but it was not found. Did the Nest build succeed?`,
    );
    process.exit(1);
  }
}

const relativeRequirePath = path
  .relative(path.dirname(outputMain), compiledMain)
  .replace(/\\\\/g, '/');

const waitForCompiledMain = allowMissing
  ? `const fs = require("node:fs");\n` +
    `const path = require("node:path");\n` +
    `const compiledMain = path.join(__dirname, ${JSON.stringify(relativeRequirePath)});\n` +
    `if (!fs.existsSync(compiledMain)) {\n` +
    `  const timeoutMs = parseInt(process.env.POKERHUB_COMPILED_MAIN_TIMEOUT_MS ?? "30000", 10);\n` +
    `  const start = Date.now();\n` +
    `  while (!fs.existsSync(compiledMain)) {\n` +
    `    if (Date.now() - start > timeoutMs) {\n` +
    `      throw new Error(\"Timed out waiting for compiled entry point at \\${compiledMain}\");\n` +
    `    }\n` +
    `    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);\n` +
    `  }\n` +
    `}\n`
  : `const path = require("node:path");\n` +
    `const compiledMain = path.join(__dirname, ${JSON.stringify(relativeRequirePath)});\n`;

const bootstrapStub =
  `const sdkMetrics = require("@opentelemetry/sdk-metrics");\n` +
  `if (!sdkMetrics.AggregationType) {\n` +
  `  sdkMetrics.AggregationType = Object.freeze({ DEFAULT: "DEFAULT" });\n` +
  `}\n` +
  waitForCompiledMain +
  `module.exports = require(compiledMain);\n`;

fs.mkdirSync(path.dirname(outputMain), { recursive: true });
fs.writeFileSync(outputMain, bootstrapStub);
