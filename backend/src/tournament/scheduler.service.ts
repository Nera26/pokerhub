import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';

/**
 * TournamentScheduler wraps BullMQ queues for scheduling tournament events
 * such as registration windows and breaks. The BullMQ import is dynamic so
 * tests can run without a Redis instance.
 */
@Injectable()
export class TournamentScheduler {
  private queues: Map<string, Queue> = new Map();

  private async getQueue(name: string): Promise<Queue> {
    const existing = this.queues.get(name);
    if (existing) return existing;

    const bull = await import('bullmq');
    const queue = new bull.Queue(name, {
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    });

    this.queues.set(name, queue);
    return queue;
  }

  async scheduleRegistration(
    tournamentId: string,
    open: Date,
    close: Date,
  ): Promise<void> {
    const queue = await this.getQueue('registration');
    await queue.add(
      'open',
      { tournamentId },
      { delay: open.getTime() - Date.now() },
    );
    await queue.add(
      'close',
      { tournamentId },
      { delay: close.getTime() - Date.now() },
    );
  }

  async scheduleLateRegistration(
    tournamentId: string,
    close: Date,
  ): Promise<void> {
    const queue = await this.getQueue('late-registration');
    await queue.add(
      'close',
      { tournamentId },
      { delay: close.getTime() - Date.now() },
    );
  }

  async scheduleBreak(
    tournamentId: string,
    start: Date,
    durationMs: number,
  ): Promise<void> {
    const queue = await this.getQueue('break');
    await queue.add(
      'start',
      { tournamentId },
      { delay: start.getTime() - Date.now() },
    );
    await queue.add(
      'end',
      { tournamentId },
      { delay: start.getTime() - Date.now() + durationMs },
    );
  }

  async scheduleLevelUps(
    tournamentId: string,
    structure: { level: number; durationMinutes: number }[],
    start: Date,
  ): Promise<void> {
    const queue = await this.getQueue('level-up');
    let current = start.getTime();
    for (const lvl of structure) {
      if (lvl.level === 1) {
        current += lvl.durationMinutes * 60_000;
        continue;
      }
      await queue.add(
        'level',
        { tournamentId, level: lvl.level },
        { delay: current - Date.now() },
      );
      current += lvl.durationMinutes * 60_000;
    }
  }
}
