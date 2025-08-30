import fs from 'fs';

interface Assignment {
  seed: number;
  tableId: number;
}
interface WorkerSeeds {
  seed: number;
  assignments: Assignment[];
}
interface SeedLog {
  runSeed: number;
  tables: number;
  workers: WorkerSeeds[];
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const data: SeedLog = JSON.parse(fs.readFileSync('seeds.json', 'utf8'));
const runRng = mulberry32(data.runSeed);

for (const [i, worker] of data.workers.entries()) {
  const expectedWorkerSeed = Math.floor(runRng() * 0xffffffff);
  if (worker.seed !== expectedWorkerSeed) {
    throw new Error(`worker ${i} seed mismatch`);
  }
  const workerRng = mulberry32(worker.seed);
  for (const [j, assign] of worker.assignments.entries()) {
    const expectedClientSeed = Math.floor(workerRng() * 0xffffffff);
    if (assign.seed !== expectedClientSeed) {
      throw new Error(`worker ${i} client ${j} seed mismatch`);
    }
    const clientRng = mulberry32(assign.seed);
    const expectedTable = Math.floor(clientRng() * data.tables);
    if (assign.tableId !== expectedTable) {
      throw new Error(`worker ${i} client ${j} table mismatch`);
    }
  }
}

console.log('seed replay deterministic');
