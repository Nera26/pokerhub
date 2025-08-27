import { spawn } from 'node:child_process';

let lighthouse;
let chromeLauncher;
try {
  ({ default: lighthouse } = await import('lighthouse'));
  ({ default: chromeLauncher } = await import('chrome-launcher'));
} catch (err) {
  console.error(
    'Lighthouse and chrome-launcher are required. Install them with "npm install -D lighthouse chrome-launcher".',
  );
  process.exit(1);
}

const url = 'http://localhost:3000';

// start Next.js production server
const server = spawn('npm', ['run', 'start'], { stdio: 'inherit' });

// wait until server is ready
const waitForServer = async () => {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) {
        return;
      }
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('Server did not start');
};

try {
  await waitForServer();

  const budgets = [
    {
      path: '/',
      resourceCounts: [
        { resourceType: 'script', budget: 10 },
        { resourceType: 'total', budget: 50 },
      ],
      resourceSizes: [
        { resourceType: 'script', budget: 250 },
        { resourceType: 'total', budget: 600 },
        { resourceType: 'image', budget: 1500 },
      ],
      timings: [
        { metric: 'interactive', budget: 5000 },
        { metric: 'first-contentful-paint', budget: 2000 },
        { metric: 'interaction-to-next-paint', budget: 200 },
        { metric: 'largest-contentful-paint', budget: 2500 },
        { metric: 'cumulative-layout-shift', budget: 0.1 },
      ],
    },
    {
      path: '/login',
      resourceCounts: [
        { resourceType: 'script', budget: 10 },
        { resourceType: 'total', budget: 50 },
      ],
      resourceSizes: [
        { resourceType: 'script', budget: 250 },
        { resourceType: 'total', budget: 600 },
        { resourceType: 'image', budget: 1500 },
      ],
      timings: [
        { metric: 'interactive', budget: 5000 },
        { metric: 'first-contentful-paint', budget: 2000 },
        { metric: 'interaction-to-next-paint', budget: 200 },
        { metric: 'largest-contentful-paint', budget: 2500 },
        { metric: 'cumulative-layout-shift', budget: 0.1 },
      ],
    },
    {
      path: '/dashboard',
      resourceCounts: [
        { resourceType: 'script', budget: 10 },
        { resourceType: 'total', budget: 50 },
      ],
      resourceSizes: [
        { resourceType: 'script', budget: 250 },
        { resourceType: 'total', budget: 600 },
        { resourceType: 'image', budget: 1500 },
      ],
      timings: [
        { metric: 'interactive', budget: 5000 },
        { metric: 'first-contentful-paint', budget: 2000 },
        { metric: 'interaction-to-next-paint', budget: 200 },
        { metric: 'largest-contentful-paint', budget: 2500 },
        { metric: 'cumulative-layout-shift', budget: 0.1 },
      ],
    },
  ];
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  try {
    let hasFailures = false;
    for (const budget of budgets) {
      const targetUrl = new URL(budget.path, url).href;
      const runnerResult = await lighthouse(
        targetUrl,
        { port: chrome.port },
        { budgets: [budget] },
      );
      const audits = runnerResult.lhr.audits;
      const inp = audits['interaction-to-next-paint']?.numericValue;
      const lcp = audits['largest-contentful-paint']?.numericValue;
      const cls = audits['cumulative-layout-shift']?.numericValue;
      console.log(
        `${budget.path} - INP: ${Math.round(inp)} ms, LCP: ${Math.round(lcp)} ms, CLS: ${cls}`,
      );

      const failingBudgets =
        audits['performance-budget']?.details?.items?.filter(
          (item) => item.overBudget,
        ) ?? [];

      if (failingBudgets.length) {
        hasFailures = true;
        console.error(`Performance budgets exceeded for ${budget.path}:`);
        for (const item of failingBudgets) {
          console.error(
            `${item.resourceType || item.metric} over budget by ${item.overBudget}`,
          );
        }
      } else {
        console.log(`Performance budgets met for ${budget.path}.`);
      }
    }
    if (hasFailures) {
      process.exitCode = 1;
    }
  } finally {
    await chrome.kill();
  }
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  server.kill();
}
