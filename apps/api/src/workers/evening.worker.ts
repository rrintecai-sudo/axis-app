import { Queue, Worker, type Job } from 'bullmq';
import { env } from '../env.js';

const redisConnection = { url: env.REDIS_URL };

// ---------------------------------------------------------------------------
// Queue
// ---------------------------------------------------------------------------
export const eveningQueue = new Queue<EveningJobData>('evening', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 30_000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface EveningJobData {
  userId: string;
  phoneNumber: string;
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------
export function startEveningWorker(): Worker<EveningJobData> {
  const worker = new Worker<EveningJobData>(
    'evening',
    async (job: Job<EveningJobData>) => {
      const { userId, phoneNumber } = job.data;

      const { sendWhatsAppMessage } = await import('../services/whatsapp.js');
      const { prisma } = await import('@axis/db');

      // Send the evening check-in prompt
      const eveningMessage =
        '¿Cómo cerró el día? Cuéntame qué lograste hoy.';

      await sendWhatsAppMessage(phoneNumber, eveningMessage);

      // Register in conversation that the evening flow was initiated so chat()
      // can pick up the context in subsequent messages
      const conversation = await prisma.conversation.create({
        data: {
          userId,
          channel: 'WHATSAPP',
          messages: {
            create: {
              role: 'ASSISTANT',
              content: eveningMessage,
            },
          },
        },
      });

      console.info(
        `[evening-worker] Evening check-in sent to ${phoneNumber}, conversationId=${conversation.id}`,
      );
    },
    {
      connection: redisConnection,
      concurrency: 5,
    },
  );

  worker.on('failed', (job, err) => {
    console.error(`[evening-worker] Job ${job?.id ?? 'unknown'} failed: ${err.message}`);
  });

  worker.on('completed', (job) => {
    console.info(
      `[evening-worker] Job ${job.id} completed for user ${job.data.userId}`,
    );
  });

  return worker;
}
