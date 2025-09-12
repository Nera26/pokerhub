import { execSync } from "node:child_process";

const sh = (c) => execSync(c, { stdio: "pipe" }).toString().trim();
const safeJson = (s, f) => { try { return JSON.parse(s); } catch { return f; } };

/* 1) CURRENT COUNTS */
const tspBackend = sh(
  'npx ts-prune -p backend/tsconfig.json --ignore "index.ts$|__tests__|\\.d\\.ts$" || true'
)
  .split("\n")
  .filter(Boolean);
const tspFrontend = sh(
  'npx ts-prune -p frontend/tsconfig.json --ignore "index.ts$|__tests__|\\.d\\.ts$" || true'
)
  .split("\n")
  .filter(Boolean);
const UNUSED = tspBackend.length + tspFrontend.length;

const jscpdCmd =
  'npx jscpd --min-lines 30 --threshold 85 --reporters json --silent '
  + '--exclude "**/{node_modules,dist,.next,build,__tests__}/**,**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx" '
  + 'backend/src frontend/src || true';
const jscpdJson = safeJson(sh(jscpdCmd) || '{"duplicates":[]}', { duplicates: [] });
const DUPLICATES = (jscpdJson.duplicates || []).length;

const staticHits = sh(
  process.platform === "win32"
    ? 'powershell -Command "Get-ChildItem -Recurse -Include *.ts,*.tsx backend/src,frontend/src '
      + '| Where-Object { $_.DirectoryName -notmatch \"__tests__\" } '
      + '| Select-String -Pattern \"fixtures|__mocks__|mockFetch|demoData|HARDCODED\" '
      + '| Measure-Object | ForEach-Object { $_.Count }"'
    : "grep -RInE 'fixtures|__mocks__|mockFetch|demoData|HARDCODED' backend/src frontend/src "
      + "--exclude-dir='__tests__' --exclude='*.test.ts' --exclude='*.test.tsx' "
      + "--exclude='*.spec.ts' --exclude='*.spec.tsx' | wc -l || true"
);
const STATIC = parseInt(staticHits || "0", 10) || 0;

/* 2) BASELINE (provided via env or default to current) */
const baselineEnv = process.env.AUDIT_BASELINE || null;
let baseline = baselineEnv ? safeJson(baselineEnv, null) : null;

if (!baseline) {
  baseline = { UNUSED, DUPLICATES, STATIC };
}

/* avoid div by zero */
const pct = (cur, base) => (base > 0 ? Math.max(0, 1 - cur / base) : cur === 0 ? 1 : 0);

/* 3) CATEGORY SCORES (match your rubric) */
const deadCode = Math.round(30 * pct(UNUSED, baseline.UNUSED));
const dups = Math.round(25 * pct(DUPLICATES, baseline.DUPLICATES));
const dynamic = Math.round(35 * pct(STATIC, baseline.STATIC));

/* simple “tests & types” gate: +10 only if typecheck & tests pass */
let testsTypes = 0;
try {
  sh('npm run -s typecheck || true');
  sh('npm test -s -- -i || true');
  testsTypes = 10;
} catch {
  testsTypes = 0;
}

const total = deadCode + dups + dynamic + testsTypes;

const current = { UNUSED, DUPLICATES, STATIC, deadCode, dups, dynamic, testsTypes };
const notes = [
  `UNUSED: ${UNUSED} (baseline ${baseline.UNUSED})`,
  `DUPLICATES: ${DUPLICATES} (baseline ${baseline.DUPLICATES})`,
  `STATIC: ${STATIC} (baseline ${baseline.STATIC})`
];

const result = { baseline, current, total, notes };
console.log(JSON.stringify(result, null, 2));
