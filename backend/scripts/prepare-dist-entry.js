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

const bootstrapStub = `const sdkMetrics = require("@opentelemetry/sdk-metrics");\n` +
  `if (!sdkMetrics.AggregationType) {\n` +
  `  sdkMetrics.AggregationType = Object.freeze({ DEFAULT: "DEFAULT" });\n` +
  `}\n` +
  `module.exports = require("./${relativeRequirePath}");\n`;

fs.mkdirSync(path.dirname(outputMain), { recursive: true });
fs.writeFileSync(outputMain, bootstrapStub);
