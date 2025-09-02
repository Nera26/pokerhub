import express from 'express';
import next from 'next';
import routes from './routes';
import { securityHeaders } from './securityHeaders';
import { getGcsClient } from './gcs';
import { setupTelemetry, shutdownTelemetry } from './telemetry';

getGcsClient();
setupTelemetry();

process.on('SIGTERM', () => {
  shutdownTelemetry().catch(() => undefined);
});
process.on('SIGINT', () => {
  shutdownTelemetry().catch(() => undefined);
});

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  server.use(securityHeaders);
  server.use('/api', routes);

  server.all('*', (req, res) => {
    return handle(req, res);
  });

  const port = process.env.PORT ?? 3000;
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
