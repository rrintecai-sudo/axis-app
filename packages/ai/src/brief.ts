import { prisma } from '@axis/db';
import type { Brief } from '@axis/db';
import { anthropic, MODEL } from './client.js';
import { BRIEF_PROMPT } from './prompts/system.js';
import { buildUserProfileContext, buildTasksContext } from './context.js';
import { retrieveRelevantMemories } from './memory.js';
import { buildMemoriesContext } from './context.js';

// ---------------------------------------------------------------------------
// Generate daily brief
// ---------------------------------------------------------------------------

export async function generateBrief(userId: string, date: Date): Promise<Brief> {
  // Normalize date to start of day (UTC)
  const dateStart = new Date(date);
  dateStart.setHours(0, 0, 0, 0);

  const dateEnd = new Date(date);
  dateEnd.setHours(23, 59, 59, 999);

  // 1. Load user with profile and life areas
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: { lifeAreas: true },
      },
      tasks: {
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
        orderBy: [
          { isTopTask: 'desc' },
          { priority: 'desc' },
          { impact: 'desc' },
        ],
      },
    },
  });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  // 2. Load recent conversations (last 48 hours)
  const fortyEightHoursAgo = new Date(date);
  fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

  const recentConversations = await prisma.conversation.findMany({
    where: {
      userId,
      createdAt: { gte: fortyEightHoursAgo },
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 20,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  // 3. Retrieve relevant memories using brief context as query
  const briefQuery = user.profile?.topPriority ?? 'prioridades del día objetivos tareas';
  const memories = await retrieveRelevantMemories(userId, briefQuery, 5);

  // 4. Build context strings
  const profileContext = user.profile
    ? buildUserProfileContext(user.profile)
    : 'Perfil no disponible.';

  const goalsContext =
    user.profile && user.profile.q1Goals.length > 0
      ? user.profile.q1Goals.join('\n')
      : 'Sin objetivos registrados.';

  const tasksContext = buildTasksContext(user.tasks);

  const recentContext = recentConversations.length > 0
    ? recentConversations
        .flatMap((conv) =>
          conv.messages.map((m) => {
            const label = m.role === 'USER' ? 'Usuario' : 'AXIS';
            return `${label}: ${m.content}`;
          }),
        )
        .join('\n')
    : 'Sin conversaciones recientes.';

  const memoriesContext = buildMemoriesContext(memories);

  // 5. Fill in the BRIEF_PROMPT
  const prompt = BRIEF_PROMPT.replace('{USER_NAME}', user.name ?? 'Usuario')
    .replace('{USER_PROFILE}', profileContext)
    .replace('{Q1_GOALS}', goalsContext)
    .replace('{PENDING_TASKS}', tasksContext)
    .replace('{RECENT_CONTEXT}', `${recentContext}\n\nMemorias relevantes:\n${memoriesContext}`);

  // 6. Call Claude
  let briefContent: string;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const firstBlock = response.content[0];
    if (!firstBlock || firstBlock.type !== 'text') {
      throw new Error('Claude returned no text for generateBrief');
    }

    briefContent = firstBlock.text.trim();
  } catch (err) {
    console.error('[brief] Claude call failed:', err);
    throw err;
  }

  // 7. Extract top priorities and top task from tasks
  const topTasks = user.tasks.filter((t) => t.isTopTask);
  const sortedByPriority = [...user.tasks].sort(
    (a, b) => b.priority - a.priority || b.impact - a.impact,
  );

  const top3 = sortedByPriority.slice(0, 3).map((t) => t.title);

  const topTaskByImpact = [...user.tasks].sort((a, b) => b.impact - a.impact)[0];
  const topTask =
    topTasks[0]?.title ?? topTaskByImpact?.title ?? null;

  // 8. Upsert the Brief record
  try {
    const brief = await prisma.brief.upsert({
      where: {
        userId_date: {
          userId,
          date: dateStart,
        },
      },
      update: {
        content: briefContent,
        topPriorities: top3,
        topTask,
      },
      create: {
        userId,
        date: dateStart,
        content: briefContent,
        topPriorities: top3,
        topTask,
      },
    });

    return brief;
  } catch (err) {
    console.error('[brief] DB upsert failed:', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Get today's brief (generate if missing)
// ---------------------------------------------------------------------------

export async function getTodaysBrief(userId: string): Promise<Brief> {
  const today = new Date();
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  try {
    const existing = await prisma.brief.findUnique({
      where: {
        userId_date: {
          userId,
          date: todayStart,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return await generateBrief(userId, today);
  } catch (err) {
    console.error('[brief] getTodaysBrief failed:', err);
    throw err;
  }
}
