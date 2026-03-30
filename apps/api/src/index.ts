import { env } from './env.js';
import { buildApp } from './app.js';

async function main(): Promise<void> {
  const app = await buildApp();

  process.on('SIGINT', () => void app.close().then(() => process.exit(0)));
  process.on('SIGTERM', () => void app.close().then(() => process.exit(0)));

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`AXIS API running on port ${env.PORT} [${env.NODE_ENV}]`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    app.log.error(`Failed to start server: ${message}`);
    process.exit(1);
  }
}

void main();
