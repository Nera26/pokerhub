import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter } from 'node:events';

interface PlayerTimer {
  deadline: bigint;
  action: () => void;
}

/**
 * ClockService provides a monotonic clock for the game. It emits a tick every
 * second and tracks per-player action deadlines.
 */
@Injectable()
export class ClockService extends EventEmitter implements OnModuleDestroy {
  private readonly handle: NodeJS.Timeout;
  private readonly timers = new Map<string, PlayerTimer>();

  constructor() {
    super();
    this.handle = setInterval(() => this.tick(), 1_000);
    this.handle.unref();
  }

  /** Returns current monotonic time in nanoseconds. */
  now(): bigint {
    return process.hrtime.bigint();
  }

  /** Register a listener for clock ticks. */
  onTick(listener: (now: bigint) => void): void {
    this.on('tick', listener);
  }

  /**
   * Start or replace an action timer for a player. When the deadline is
   * reached the provided callback is executed.
   */
  setTimer(playerId: string, ms: number, action: () => void): void {
    const deadline = this.now() + BigInt(ms) * 1_000_000n;
    this.timers.set(playerId, { deadline, action });
  }

  /** Clear an active timer for the given player. */
  clearTimer(playerId: string): void {
    this.timers.delete(playerId);
  }

  private tick(): void {
    const now = this.now();
    this.emit('tick', now);
    for (const [id, timer] of this.timers) {
      if (now >= timer.deadline) {
        this.timers.delete(id);
        timer.action();
      }
    }
  }

  onModuleDestroy(): void {
    clearInterval(this.handle);
  }
}
