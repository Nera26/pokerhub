import http from 'k6/http';
import { Trend } from 'k6/metrics';

const rssGrowth = new Trend('rss_growth');
const gcPause = new Trend('gc_pause');
const cpuUsage = new Trend('cpu_usage');

export function setupMetrics(url) {
  if (!url) return {};
  try {
    const res = http.get(url);
    const data = res.json();
    if (data.rssBytes !== undefined) {
      return { startRss: data.rssBytes };
    }
  } catch (e) {
    // ignore parse errors
  }
  return {};
}

export function teardownMetrics(url, data) {
  if (!url) return;
  try {
    const res = http.get(url);
    const end = res.json();
    if (end.rssDeltaPct !== undefined) {
      rssGrowth.add(end.rssDeltaPct);
    } else if (data.startRss && end.rssBytes !== undefined) {
      const growth = ((end.rssBytes - data.startRss) / data.startRss) * 100;
      rssGrowth.add(growth);
    }
    if (end.gcPauseP95 !== undefined) {
      gcPause.add(end.gcPauseP95);
    }
    if (end.cpuPercent !== undefined) {
      cpuUsage.add(end.cpuPercent);
    }
  } catch (e) {
    // ignore network/parse errors
  }
}

export function pushSummary(data, { latencyMetric, cpuMetric } = {}) {
  const out = {};
  if (latencyMetric) {
    const latMetric = data.metrics[latencyMetric];
    const latHist = (latMetric && (latMetric.histogram || latMetric.bins)) || {};
    out['metrics/latency-histogram.json'] = JSON.stringify(latHist, null, 2);
  }
  if (cpuMetric) {
    const cpuMetricObj = data.metrics[cpuMetric];
    const cpuHist =
      (cpuMetricObj && (cpuMetricObj.histogram || cpuMetricObj.bins)) || {};
    out['metrics/cpu-histogram.json'] = JSON.stringify(cpuHist, null, 2);
  }
  const gcMetric = data.metrics.gc_pause;
  const gcHist = (gcMetric && (gcMetric.histogram || gcMetric.bins)) || {};
  const heapMetric = data.metrics.rss_growth;
  const heapHist =
    (heapMetric && (heapMetric.histogram || heapMetric.bins)) || {};
  out['metrics/gc-histogram.json'] = JSON.stringify(gcHist, null, 2);
  out['metrics/heap-histogram.json'] = JSON.stringify(heapHist, null, 2);
  return out;
}
