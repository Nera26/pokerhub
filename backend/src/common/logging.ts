const isProduction = (process.env.NODE_ENV ?? 'development') === 'production';

type LoggerLike = {
  log?: (...args: unknown[]) => void;
  info?: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
};

interface LogOptions {
  logger?: LoggerLike;
  details?: unknown[];
}

export function logInfrastructureNotice(
  message: string,
  { logger, details = [] }: LogOptions = {},
): void {
  const warnFn =
    (logger?.warn?.bind(logger) as ((...args: unknown[]) => void) | undefined) ??
    console.warn.bind(console);
  const infoFn =
    (logger?.log?.bind(logger) as ((...args: unknown[]) => void) | undefined) ??
    (logger?.info?.bind(logger) as ((...args: unknown[]) => void) | undefined) ??
    console.info.bind(console);

  if (isProduction) {
    warnFn(message, ...details);
  } else {
    infoFn(message, ...details);
  }
}
