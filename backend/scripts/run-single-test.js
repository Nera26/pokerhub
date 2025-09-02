const { runCLI } = require('jest');
const path = require('path');

const root = process.cwd();
const config = {
  rootDir: root,
  testMatch: [path.join(root, 'src/wallet/wallet.ledger.property.spec.ts')],
  runInBand: true,
  verbose: true,
};

runCLI({ _: [], $0: process.argv[0], runInBand: true, json: true, outputFile: 'backend-jest-single.json' }, [root])
  .then(result => {
    console.log('Jest finished, writing backend-jest-single.json');
    process.exit(result.results.success ? 0 : 1);
  })
  .catch(err => {
    console.error('Jest run error:', err);
    process.exit(2);
  });
