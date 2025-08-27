import { env } from '@/lib/env';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const levels: LogLevel[] = ['error', 'warn', 'info', 'debug'];
const currentLevel: LogLevel = env.NEXT_PUBLIC_LOG_LEVEL;

function shouldLog(level: LogLevel) {
  return levels.indexOf(level) <= levels.indexOf(currentLevel);
}

export const logger = {
  error: (...args: unknown[]) => {
    if (shouldLog('error')) {
      console.error(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (shouldLog('warn')) {
      console.warn(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (shouldLog('info')) {
      console.info(...args);
    }
  },
  debug: (...args: unknown[]) => {
    if (shouldLog('debug')) {
      console.debug(...args);
    }
  },
};
