import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => {
  const explicitUrl = process.env.REDIS_URL?.trim();
  if (explicitUrl) {
    return { url: explicitUrl };
  }

  const host = process.env.REDIS_HOST?.trim();
  const port = process.env.REDIS_PORT?.trim();
  if (host || port) {
    const fallbackHost = host && host.length > 0 ? host : 'localhost';
    const fallbackPort = port && port.length > 0 ? Number(port) : 6379;
    return { url: `redis://${fallbackHost}:${fallbackPort}` };
  }

  return { url: undefined };
});
