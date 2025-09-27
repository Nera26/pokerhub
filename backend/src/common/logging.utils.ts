import type { LoggerService } from '@nestjs/common';

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProduction = nodeEnv === 'production';

function formatMessage(message: string, error?: unknown): string {
  if (!error) {
    return message;
  }

  if (error instanceof Error) {
    const reason = error.message || error.name;
    return reason ? `${message} (${reason})` : message;
  }

  try {
    return `${message} (${String(error)})`;
  } catch {
    return message;
  }
}

type NoticeLogger = Pick<LoggerService, 'log' | 'warn'>;
type ErrorLogger = Pick<LoggerService, 'log' | 'warn' | 'error'>;

export function logBootstrapNotice(
  logger: NoticeLogger,
  message: string,
  error?: unknown,
): void {
  const formatted = formatMessage(message, error);
  if (isProduction) {
    logger.warn(formatted);
    return;
  }

  logger.log(formatted);
}

export function logBootstrapError(
  logger: ErrorLogger,
  message: string,
  error?: unknown,
): void {
  const formatted = formatMessage(message, error);
  if (isProduction) {
    logger.error(formatted);
    return;
  }

  logger.log(formatted);
}
