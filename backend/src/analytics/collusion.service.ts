import { Injectable } from '@nestjs/common';

interface SessionInfo {
  userId: string;
  deviceId: string;
  ip: string;
  timestamp: number;
}

interface ActionInfo {
  userId: string;
  timestamp: number;
}

@Injectable()
export class CollusionDetectionService {
  clusterByDeviceAndIp(sessions: SessionInfo[]): Map<string, Set<string>> {
    const clusters = new Map<string, Set<string>>();
    for (const s of sessions) {
      for (const key of [s.deviceId, s.ip]) {
        if (!clusters.has(key)) clusters.set(key, new Set());
        clusters.get(key)!.add(s.userId);
      }
    }
    return clusters;
  }

  detectTimingCollusion(
    actions: ActionInfo[],
    thresholdMs = 2000,
  ): [string, string][] {
    const suspicious: [string, string][] = [];
    const sorted = [...actions].sort((a, b) => a.timestamp - b.timestamp);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (
        curr.userId !== prev.userId &&
        curr.timestamp - prev.timestamp < thresholdMs
      ) {
        suspicious.push([prev.userId, curr.userId]);
      }
    }
    return suspicious;
  }
}

