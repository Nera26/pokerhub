import fs from 'node:fs';

type Nullable<T> = T | undefined | null;

const readEnv = (key: string): string | undefined => {
  const direct = process.env[key];
  if (direct && direct.trim().length > 0) {
    return direct.trim();
  }

  const fileKey = `${key}_FILE`;
  const filePath = process.env[fileKey];

  if (!filePath) {
    return undefined;
  }

  try {
    return fs.readFileSync(filePath, 'utf8').trim();
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'unknown error while reading secret file';
    throw new Error(`Failed to read ${fileKey}=${filePath}: ${message}`);
  }
};

const coerceString = (value: Nullable<string>): string | undefined => {
  if (value == null) {
    return undefined;
  }
  const trimmed = `${value}`.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const resolveDatabaseUrl = (): string => {
  const explicitUrl = coerceString(readEnv('DATABASE_URL'));

  const fallbackHost = coerceString(readEnv('DB_HOST')) ?? 'localhost';
  const fallbackPort =
    coerceString(readEnv('DB_HOST_PORT')) ??
    coerceString(readEnv('DB_PORT')) ??
    '15432';
  const fallbackUser = coerceString(readEnv('DB_USER')) ?? 'postgres';
  const fallbackPassword = coerceString(readEnv('DB_PASS')) ??
    coerceString(readEnv('DB_PASSWORD')) ??
    coerceString(readEnv('POSTGRES_PASSWORD'));
  const fallbackDatabase = coerceString(readEnv('DB_NAME')) ?? 'pokerhub';

  if (explicitUrl) {
    try {
      const url = new URL(explicitUrl);

      if (!url.username && fallbackUser) {
        url.username = fallbackUser;
      }

      if (!url.password) {
        if (fallbackPassword) {
          url.password = fallbackPassword;
        } else {
          throw new Error(
            'DATABASE_URL is missing a password. Provide it in the URL or via DB_PASS/DB_PASSWORD/POSTGRES_PASSWORD.',
          );
        }
      }

      if (!url.hostname) {
        url.hostname = fallbackHost;
      }

      if (!url.port && fallbackPort) {
        url.port = fallbackPort;
      }

      if (!url.pathname || url.pathname === '/') {
        url.pathname = `/${fallbackDatabase}`;
      }

      return url.toString();
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Unknown error while parsing DATABASE_URL';
      throw new Error(`Invalid DATABASE_URL provided: ${message}`);
    }
  }

  const password = fallbackPassword ?? 'postgres';

  return `postgres://${encodeURIComponent(fallbackUser)}:${encodeURIComponent(
    password,
  )}@${fallbackHost}:${fallbackPort}/${fallbackDatabase}`;
};

