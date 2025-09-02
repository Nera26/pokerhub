const { runCLI } = require('jest');
const path = require('path');
const fs = require('fs');

async function main() {
  const root = process.cwd();
  const outputDir = path.join(root, '../storage/ledger-audit');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputFile = path.join(outputDir, 'summary.json');
  const testPaths = [
    path.join(root, 'test/wallet/ledger.property.spec.ts'),
    path.join(root, 'test/wallet/hand-logs.replay.property.spec.ts'),
  ];

  const { results } = await runCLI(
    {
      _: testPaths,
      $0: 'jest',
      runInBand: true,
      json: true,
      outputFile,
    },
    [root]
  );

  process.exit(results.success ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
