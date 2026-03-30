import { prisma } from '@axis/db';
import { briefQueue } from './brief.worker.js';
import { eveningQueue } from './evening.worker.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the current time in a given timezone formatted as "HH:MM".
 */
function currentTimeInTimezone(timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone,
    }).format(new Date());
  } catch {
    // Fallback to UTC if timezone is invalid
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    }).format(new Date());
  }
}

/**
 * Normalise time strings so both "7:00" and "07:00" match.
 */
function normalizeTime(time: string): string {
  const [h = '0', m = '0'] = time.split(':');
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
}

function startOfTodayUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function endOfTodayUTC(): Date {
  const d = new Date();
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

// ---------------------------------------------------------------------------
// Morning scheduler — enqueues brief for users whose wakeUpTime matches now
// ---------------------------------------------------------------------------
async function runMorningScheduler(): Promise<void> {
  try {
    const usersWithProfiles = await prisma.userProfile.findMany({
      include: { user: true },
    });

    for (const profile of usersWithProfiles) {
      const { user, wakeUpTime, sleepTime: _sleepTime } = profile;

      // Only active subscriptions
      if (
        user.subscriptionStatus !== 'TRIAL' &&
        user.subscriptionStatus !== 'ACTIVE'
      ) {
        continue;
      }

      const currentTime = currentTimeInTimezone(user.timezone);
      if (normalizeTime(currentTime) !== normalizeTime(wakeUpTime)) {
        continue;
      }

      // Check if brief already exists today
      const existingBrief = await prisma.brief.findFirst({
        where: {
          userId: user.id,
          date: {
            gte: startOfTodayUTC(),
            lte: endOfTodayUTC(),
          },
        },
      });

      if (existingBrief) {
        continue;
      }

      // Enqueue brief job — run immediately (delay 0)
      await briefQueue.add(
        'generate-brief',
        {
          userId: user.id,
          scheduledFor: new Date().toISOString(),
        },
        {
          jobId: `brief-${user.id}-${new Date().toISOString().slice(0, 10)}`,
          // Deduplicate: same jobId won't be re-queued if already exists
        },
      );

      console.info(`[scheduler] Queued morning brief for user ${user.id}`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[scheduler] Morning scheduler error: ${message}`);
  }
}

// ---------------------------------------------------------------------------
// Evening scheduler — enqueues check-in for users whose sleepTime matches now
// ---------------------------------------------------------------------------
async function runEveningScheduler(): Promise<void> {
  try {
    const usersWithProfiles = await prisma.userProfile.findMany({
      include: { user: true },
    });

    for (const profile of usersWithProfiles) {
      const { user, sleepTime } = profile;

      if (
        user.subscriptionStatus !== 'TRIAL' &&
        user.subscriptionStatus !== 'ACTIVE'
      ) {
        continue;
      }

      if (!user.phone) {
        continue; // Can't send WhatsApp without phone
      }

      const currentTime = currentTimeInTimezone(user.timezone);
      if (normalizeTime(currentTime) !== normalizeTime(sleepTime)) {
        continue;
      }

      await eveningQueue.add(
        'evening-checkin',
        {
          userId: user.id,
          phoneNumber: user.phone,
        },
        {
          jobId: `evening-${user.id}-${new Date().toISOString().slice(0, 10)}`,
        },
      );

      console.info(`[scheduler] Queued evening check-in for user ${user.id}`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[scheduler] Evening scheduler error: ${message}`);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export function startSchedulers(): void {
  console.info('[scheduler] Starting schedulers — tick every 60s');

  // Run once immediately on startup
  void runMorningScheduler();
  void runEveningScheduler();

  setInterval(() => {
    void runMorningScheduler();
    void runEveningScheduler();
  }, 60_000);
}
