import { readFile } from 'node:fs/promises';

const budgets = {
  '/': 170 * 1024, // 170 KB
  '/login': 110 * 1024, // 110 KB
  '/dashboard': 220 * 1024, // 220 KB
};

const entrypointMap = {
  '/': 'app/(site)/page',
  '/login': 'app/login/page',
  '/dashboard': 'app/dashboard/page',
};

try {
  const stats = JSON.parse(await readFile('.next/analyze/client.json', 'utf8'));
  const entrySizes = {};
  for (const item of stats) {
    const size = item.parsedSize ?? 0;
    const entrypoints = item.isInitialByEntrypoint || {};
    for (const [entry, initial] of Object.entries(entrypoints)) {
      if (initial) {
        entrySizes[entry] = (entrySizes[entry] || 0) + size;
      }
    }
  }

  let hasFailures = false;
  for (const [route, entry] of Object.entries(entrypointMap)) {
    const size = entrySizes[entry] || 0;
    const budget = budgets[route];
    const sizeKB = (size / 1024).toFixed(1);
    const budgetKB = (budget / 1024).toFixed(1);
    if (size > budget) {
      hasFailures = true;
      console.error(
        `Bundle size exceeds budget for ${route}: ${sizeKB} KB > ${budgetKB} KB`,
      );
    } else {
      console.log(
        `${route} bundle size within budget: ${sizeKB} KB / ${budgetKB} KB`,
      );
    }
  }
  if (hasFailures) {
    process.exit(1);
  }
} catch (err) {
  console.error(err);
  process.exit(1);
}
