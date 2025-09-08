import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const sh = (c) => execSync(c, { stdio: "pipe" }).toString().trim();

const rows = ["id,path,type,status"];
let id = 1;

function addUnused(tsconfig) {
  const out = sh(`npx ts-prune -p ${tsconfig} --ignore "index.ts$|__tests__|\\.d\\.ts$" || true`);
  out.split("\n").filter(Boolean).forEach((line) => {
    const m = line.match(/^(.*):(\d+)/);
    if (m) rows.push(`${id++},${m[1]}:${m[2]},unused,todo`);
  });
}

addUnused("backend/tsconfig.json");
addUnused("frontend/tsconfig.json");

const staticOut = sh(
  "grep -RInE 'fixtures|__mocks__|mockFetch|demoData|HARDCODED' backend/src frontend/src " +
    "--exclude-dir='__tests__' --exclude='*.test.ts' --exclude='*.test.tsx' " +
    "--exclude='*.spec.ts' --exclude='*.spec.tsx' || true"
);
staticOut.split("\n").filter(Boolean).forEach((line) => {
  const m = line.match(/^(.*):(\d+):/);
  if (m) rows.push(`${id++},${m[1]}:${m[2]},static,todo`);
});

writeFileSync("audit/backlog.csv", rows.join("\n"));
