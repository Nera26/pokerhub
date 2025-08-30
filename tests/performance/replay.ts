import { runLoad } from "./socket-load";
import fs from "fs";

const file = process.env.SEEDS_FILE || "metrics/seeds.json";

if (!fs.existsSync(file)) {
  console.error(`Seeds file ${file} not found`);
  process.exit(1);
}

runLoad(file);
