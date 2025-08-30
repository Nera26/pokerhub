import { runLoad } from "./socket-load";
import fs from "fs";
import crypto from "crypto";

const file = process.env.SEEDS_FILE || "metrics/seeds.json";

if (!fs.existsSync(file)) {
  console.error(`Seeds file ${file} not found`);
  process.exit(1);
}

const baseline = fs.readFileSync(file, "utf8");
runLoad(file).then(() => {
  const replay = fs.readFileSync("metrics/seeds.json", "utf8");
  const baseHash = crypto.createHash("sha256").update(baseline).digest("hex");
  const replayHash = crypto
    .createHash("sha256")
    .update(replay)
    .digest("hex");
  if (baseHash !== replayHash) {
    console.error("Replay diverged from baseline seeds");
    process.exit(1);
  } else {
    console.log("Replay matched baseline seeds");
  }
});
