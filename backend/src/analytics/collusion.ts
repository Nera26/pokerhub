import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { detectChipDump } from '@shared/analytics/collusion';
import { AnalyticsService } from './analytics.service';
import { CollusionService } from './collusion.service';
import type { Transfer } from '@shared/analytics/collusion';
import type { Events } from '@shared/events';

type GameEvent = Events['game.event'];

interface CollusionGameEvent extends GameEvent {
  sessionId: string;
  userId: string;
  vpip: number;
  seat: number;
  timestamp: number;
  transfer?: Transfer;
}

@Injectable()
export class CollusionDetectionJob {
  private readonly logger = new Logger(CollusionDetectionJob.name);
  private lastCheck = Date.now();
  private readonly thresholds: {
    sharedDevices: number;
    sharedIps: number;
    vpipCorrelation: number;
    timingSimilarity: number;
    seatProximity: number;
    chipDumpScore: number;
  };

  constructor(
    private readonly config: ConfigService,
    private readonly analytics: AnalyticsService,
    private readonly collusion: CollusionService,
  ) {
    this.thresholds = this.config.get('analytics.collusionThresholds', {
      sharedDevices: 0,
      sharedIps: 0,
      vpipCorrelation: 0.9,
      timingSimilarity: 0.9,
      seatProximity: 0.9,
      chipDumpScore: 0.8,
    });
    setInterval(() => void this.run(), 10 * 60_000);
  }

  private isCollusionGameEvent(event: GameEvent): event is CollusionGameEvent {
    return (
      typeof event === 'object' &&
      event !== null &&
      typeof event.sessionId === 'string' &&
      typeof event.userId === 'string' &&
      typeof event.vpip === 'number' &&
      typeof event.seat === 'number' &&
      typeof event.timestamp === 'number'
    );
  }

  private async run() {
    const events = (await this.analytics.rangeStream(
      'analytics:game',
      this.lastCheck,
      'game.event',
    )).filter((event): event is CollusionGameEvent =>
      this.isCollusionGameEvent(event),
    );
    this.lastCheck = Date.now();

    const sessions: Record<string, CollusionGameEvent[]> = {};
    for (const ev of events) {
      sessions[ev.sessionId] ??= [];
      sessions[ev.sessionId].push(ev);
    }

    for (const [sessionId, evts] of Object.entries(sessions)) {
      const users = Array.from(new Set(evts.map((e) => e.userId)));
      if (users.length < 2) continue;
      for (let i = 0; i < users.length; i++) {
        for (let j = i + 1; j < users.length; j++) {
          const a = users[i];
          const b = users[j];
          const vpipA = evts.filter((e) => e.userId === a).map((e) => e.vpip);
          const vpipB = evts.filter((e) => e.userId === b).map((e) => e.vpip);
          const seatsA = evts.filter((e) => e.userId === a).map((e) => e.seat);
          const seatsB = evts.filter((e) => e.userId === b).map((e) => e.seat);
          const transfers = evts
            .flatMap((e) => (e.transfer ? [e.transfer] : []))
            .filter(
              (t) =>
                (t.from === a && t.to === b) ||
                (t.from === b && t.to === a),
            );

          const features = await this.collusion.extractFeatures(
            a,
            b,
            vpipA,
            vpipB,
            seatsA,
            seatsB,
          );
          const dumpScore = detectChipDump(transfers);
          const flagged =
            features.sharedDevices.length > this.thresholds.sharedDevices ||
            features.sharedIps.length > this.thresholds.sharedIps ||
            features.vpipCorrelation > this.thresholds.vpipCorrelation ||
            features.timingSimilarity > this.thresholds.timingSimilarity ||
            features.seatProximity > this.thresholds.seatProximity ||
            dumpScore > this.thresholds.chipDumpScore;
          if (flagged) {
            await this.collusion.flagSession(sessionId, [a, b], {
              ...features,
              chipDumpScore: dumpScore,
            });
          }
        }
      }
    }
  }
}
