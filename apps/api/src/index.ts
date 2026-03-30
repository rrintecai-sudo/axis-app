import { env } from './env.js';
import { buildApp } from './app.js';
import { startBriefWorker } from './workers/brief.worker.js';
import { startEveningWorker } from './workers/evening.worker.js';
import { startSchedulers } from './workers/scheduler.js';

async function main(): Promise<void> {
  const app = await buildApp();

  // Start BullMQ workers
  const briefWorker = startBriefWorker();
  const eveningWorker = startEveningWorker();

  // Start cron-like schedulers
  startSchedulers();

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    app.log.info(`Received ${signal}, shutting down gracefully...`);
    try {
      await briefWorker.close();
      await eveningWorker.close();
      await app.close();
      app.log.info('Server closed');
      process.exit(0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      app.log.error(`Error during shutdown: ${message}`);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

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
