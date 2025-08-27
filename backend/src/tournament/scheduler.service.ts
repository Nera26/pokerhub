import { Injectable } from '@nestjs/common';

/**
 * TournamentScheduler wraps BullMQ queues for scheduling tournament events
 * such as registration windows and breaks. The BullMQ import is dynamic so
 * tests can run without a Redis instance.
 */
@Injectable()
export class TournamentScheduler {
  private registrationQueue: any | undefined;
  private breakQueue: any | undefined;

  private async getQueue(name: string): Promise<any> {
    if (name === 'registration' && this.registrationQueue) return this.registrationQueue;
    if (name === 'break' && this.breakQueue) return this.breakQueue;

    const bull = await import('bullmq');
    const queue = new bull.Queue(name, {
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    });

    if (name === 'registration') this.registrationQueue = queue;
    else if (name === 'break') this.breakQueue = queue;

    return queue;
  }

  async scheduleRegistration(
    tournamentId: string,
    open: Date,
    close: Date,
  ): Promise<void> {
    const queue = await this.getQueue('registration');
    await queue.add('open', { tournamentId }, { delay: open.getTime() - Date.now() });
    await queue.add('close', { tournamentId }, { delay: close.getTime() - Date.now() });
  }

  async scheduleBreak(
    tournamentId: string,
    start: Date,
    durationMs: number,
  ): Promise<void> {
    const queue = await this.getQueue('break');
    await queue.add('start', { tournamentId }, { delay: start.getTime() - Date.now() });
    await queue.add('end', { tournamentId }, { delay: start.getTime() - Date.now() + durationMs });
  }
}
