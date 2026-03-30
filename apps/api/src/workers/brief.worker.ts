import { Queue, Worker, type Job } from 'bullmq';
import { env } from '../env.js';

const redisConnection = { url: env.REDIS_URL };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface BriefJobData {
  userId: string;
  scheduledFor: string; // ISO date string
}

// ---------------------------------------------------------------------------
// Queue
// ---------------------------------------------------------------------------
export const briefQueue = new Queue<BriefJobData>('briefs', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60_000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
});

// ---------------------------------------------------------------------------
// Helper to enqueue a brief job for a user
// ---------------------------------------------------------------------------
export async function scheduleBrief(userId: string, scheduledFor: Date): Promise<void> {
  const delay = Math.max(0, scheduledFor.getTime() - Date.now());
  await briefQueue.add(
    'generate-brief',
    { userId, scheduledFor: scheduledFor.toISOString() },
    {
      delay,
      jobId: `brief-${userId}-${scheduledFor.toISOString().slice(0, 10)}`,
    },
  );
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------
export function startBriefWorker(): Worker<BriefJobData> {
  const worker = new Worker<BriefJobData>(
    'briefs',
    async (job: Job<BriefJobData>) => {
      const { userId } = job.data;

      // generateBrief calls Claude, upserts the brief in DB, and returns it
      const { generateBrief } = await import('@axis/ai');
      const { prisma } = await import('@axis/db');
      const { sendFormattedMessage } = await import('../services/whatsapp.js');

      const scheduledDate = new Date(job.data.scheduledFor);
      const brief = await generateBrief(userId, scheduledDate);

      // Send the brief content to the user via WhatsApp
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.phone) {
        await sendFormattedMessage(user.phone, brief.content);

        // Mark brief as sent
        await prisma.brief.update({
          where: { id: brief.id },
          data: { sentAt: new Date() },
        });
      } else {
        job.log(`User ${userId} has no phone — brief generated but not sent`);
      }
    },
    {
      connection: redisConnection,
      concurrency: 5,
    },
  );

  worker.on('failed', (job, err) => {
    console.error(`[brief-worker] Job ${job?.id ?? 'unknown'} failed: ${err.message}`);
  });

  worker.on('completed', (job) => {
    console.info(`[brief-worker] Job ${job.id} completed for user ${job.data.userId}`);
  });

  return worker;
}
