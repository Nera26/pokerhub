import { Injectable, OnModuleDestroy, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  private readonly actionTimeoutMs: number;

  constructor(@Optional() private readonly config: ConfigService = new ConfigService()) {
    super();
    this.handle = setInterval(() => this.tick(), 1_000);
    this.handle.unref();
    this.actionTimeoutMs = this.config.get<number>('game.actionTimeoutMs', 30_000);
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
   * Start or replace an action timer for a player at a specific table. When
   * the deadline is reached the provided callback is executed.
   */
  setTimer(
    playerId: string,
    tableId: string,
    action: () => void,
    ms = this.actionTimeoutMs,
  ): void {
    const deadline = this.now() + BigInt(ms) * 1_000_000n;
    this.timers.set(this.key(playerId, tableId), { deadline, action });
  }

  /** Clear an active timer for the given player at the specified table. */
  clearTimer(playerId: string, tableId: string): void {
    this.timers.delete(this.key(playerId, tableId));
  }

  private key(playerId: string, tableId: string): string {
    return `${tableId}:${playerId}`;
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
