import fs from "fs";
import { spawnSync } from "child_process";
import path from "path";

const seeds = JSON.parse(fs.readFileSync(path.resolve("seeds.json"), "utf-8"));
const seed = seeds.runSeed;

const script = path.resolve(__dirname, "high-scale-harness.ts");
spawnSync("ts-node", [script], {
  stdio: "inherit",
  env: { ...process.env, SEED: String(seed) },
});
