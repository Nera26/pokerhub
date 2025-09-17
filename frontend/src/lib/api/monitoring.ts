import {
  MonitoringAcceptedResponseSchema,
  WebVitalMetricSchema,
  type MonitoringAcceptedResponse,
  type WebVitalMetric,
} from '@shared/types';
import { apiClient } from './client';

export async function recordWebVital(
  metric: WebVitalMetric,
  opts: { keepalive?: boolean } = {},
): Promise<MonitoringAcceptedResponse> {
  const payload = WebVitalMetricSchema.parse(metric);
  return apiClient('/api/monitoring', MonitoringAcceptedResponseSchema, {
    method: 'POST',
    body: payload,
    ...(opts.keepalive !== undefined && { keepalive: opts.keepalive }),
  });
}
