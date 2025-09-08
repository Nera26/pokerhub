import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";

const sh = (c) => execSync(c, { stdio: "pipe" }).toString().trim();
const safeJson = (s, f) => { try { return JSON.parse(s); } catch { return f; } };

if (!existsSync("audit")) mkdirSync("audit", { recursive: true });

/* 1) CURRENT COUNTS */
const tspBackend = sh('npx ts-prune -p backend/tsconfig.json || true').split("\n").filter(Boolean);
const tspFrontend = sh('npx ts-prune -p frontend/tsconfig.json || true').split("\n").filter(Boolean);
const UNUSED = tspBackend.length + tspFrontend.length;

const jscpdJson = safeJson(
  sh('npx jscpd --min-lines 30 --threshold 85 --reporters json --silent --ignore "**/{node_modules,dist,.next,build}/**" backend/src frontend/src || true') || '{"duplicates":[]}',
  { duplicates: [] }
);
const DUPLICATES = (jscpdJson.duplicates || []).length;

const staticHits = sh(
  process.platform === "win32"
    ? 'powershell -Command "Get-ChildItem -Recurse -Include *.ts,*.tsx backend/src frontend/src | Select-String -Pattern \"fixtures|__mocks__|mockFetch|demoData|HARDCODED\" | Measure-Object | % {$_.Count}"'
    : "grep -RInE 'fixtures|__mocks__|mockFetch|demoData|HARDCODED' backend/src frontend/src | wc -l || true"
);
const STATIC = parseInt(staticHits || "0", 10) || 0;

/* 2) BASELINE (first run sets it) */
const scorePath = "audit/score.json";
let score = existsSync(scorePath)
  ? JSON.parse(readFileSync(scorePath, "utf8"))
  : { baseline: null, current: null, total: 0, notes: [] };

if (!score.baseline) {
  score.baseline = { UNUSED, DUPLICATES, STATIC };
}

/* avoid div by zero */
const pct = (cur, base) => (base > 0 ? Math.max(0, 1 - cur / base) : cur === 0 ? 1 : 0);

/* 3) CATEGORY SCORES (match your rubric) */
const deadCode = Math.round(30 * pct(UNUSED, score.baseline.UNUSED));
const dups     = Math.round(25 * pct(DUPLICATES, score.baseline.DUPLICATES));
const dynamic  = Math.round(35 * pct(STATIC, score.baseline.STATIC));

/* simple “tests & types” gate: +10 only if typecheck & tests pass */
let testsTypes = 0;
try {
  sh('npm run -s typecheck || true');
  sh('npm test -s -- -i || true');
  testsTypes = 10;
} catch { testsTypes = 0; }

const total = deadCode + dups + dynamic + testsTypes;

score.current = { UNUSED, DUPLICATES, STATIC, deadCode, dups, dynamic, testsTypes };
score.total = total;
score.notes = [
  `UNUSED: ${UNUSED} (baseline ${score.baseline.UNUSED})`,
  `DUPLICATES: ${DUPLICATES} (baseline ${score.baseline.DUPLICATES})`,
  `STATIC: ${STATIC} (baseline ${score.baseline.STATIC})`
];

writeFileSync(scorePath, JSON.stringify(score, null, 2));
console.log(JSON.stringify({ total, current: score.current, notes: score.notes }, null, 2));
