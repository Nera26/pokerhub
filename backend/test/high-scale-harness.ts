import cluster from "cluster";
import fs from "fs";
import { runPrimary, setupToxiproxy, workerMain } from "./load/shared/socket-harness";

if (cluster.isPrimary) {
  runPrimary({
    onStart: setupToxiproxy,
    onComplete: async (_result) => {
      const mem = process.memoryUsage();
      fs.writeFileSync("memory-usage.json", JSON.stringify(mem, null, 2));
      if (typeof (global as any).gc === "function") {
        const before = process.memoryUsage();
        (global as any).gc();
        const after = process.memoryUsage();
        fs.writeFileSync("gc-usage.json", JSON.stringify({ before, after }, null, 2));
      }
    },
  });
} else {
  void workerMain();
}
