const fs = require('fs');
const files = [
  'docs/game-engine-spec.md',
  'docs/player/tournament-handbook.md',
  'docs/reconciliation-guide.md',
  'docs/milestone-plan.md'
];
let missing = false;
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const hasVersion = /\*\*Version:\*\*\s*\d+\.\d+\.\d+/.test(text);
  const hasDate = /\*\*Last Updated:\*\*\s*\d{4}-\d{2}-\d{2}/.test(text);
  if (!hasVersion || !hasDate) {
    console.error(`${file} missing metadata:` + (!hasVersion ? ' version' : '') + (!hasDate ? ' last-updated' : ''));
    missing = true;
  }
}
if (missing) {
  process.exit(1);
}
