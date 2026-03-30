import { prisma } from '@axis/db';
import { anthropic, MODEL } from './client.js';
import { WEEKLY_ANALYSIS_PROMPT } from './prompts/system.js';
import { buildUserProfileContext } from './context.js';

// ---------------------------------------------------------------------------
// Generate weekly analysis
// ---------------------------------------------------------------------------

export async function generateWeeklyAnalysis(userId: string): Promise<string> {
  // 1. Load user with profile and life areas
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: { lifeAreas: true },
      },
    },
  });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  // 2. Load tasks from the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      createdAt: { gte: sevenDaysAgo },
    },
    orderBy: { createdAt: 'desc' },
  });

  const completedTasks = tasks.filter((t) => t.status === 'DONE');
  const pendingTasks = tasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS');
  const skippedTasks = tasks.filter((t) => t.status === 'SKIPPED');

  // 3. Load conversations from the last 7 days
  const conversations = await prisma.conversation.findMany({
    where: {
      userId,
      createdAt: { gte: sevenDaysAgo },
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 15,
      },
    },
    orderBy: { createdAt: 'asc' },
    take: 7,
  });

  // 4. Build context strings
  const profileContext = user.profile
    ? buildUserProfileContext(user.profile)
    : 'Perfil no disponible.';

  const goalsContext =
    user.profile && user.profile.q1Goals.length > 0
      ? user.profile.q1Goals.join('\n')
      : 'Sin objetivos registrados.';

  const formatTaskList = (taskList: typeof tasks): string => {
    if (taskList.length === 0) return 'Ninguna';
    return taskList.map((t) => `- ${t.title}${t.aiReason ? ` (${t.aiReason})` : ''}`).join('\n');
  };

  const weeklyConversations = conversations.length > 0
    ? conversations
        .flatMap((conv) =>
          conv.messages.map((m) => {
            const label = m.role === 'USER' ? 'Usuario' : 'AXIS';
            return `${label}: ${m.content}`;
          }),
        )
        .join('\n')
    : 'Sin conversaciones registradas esta semana.';

  // 5. Fill in the WEEKLY_ANALYSIS_PROMPT
  const prompt = WEEKLY_ANALYSIS_PROMPT.replace('{USER_NAME}', user.name ?? 'Usuario')
    .replace('{USER_PROFILE}', `${profileContext}\n\nObjetivos del trimestre:\n${goalsContext}`)
    .replace('{COMPLETED_TASKS}', formatTaskList(completedTasks))
    .replace('{PENDING_TASKS}', formatTaskList(pendingTasks))
    .replace('{SKIPPED_TASKS}', formatTaskList(skippedTasks))
    .replace('{WEEKLY_CONVERSATIONS}', weeklyConversations);

  // 6. Call Claude
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 768,
      messages: [{ role: 'user', content: prompt }],
    });

    const firstBlock = response.content[0];
    if (!firstBlock || firstBlock.type !== 'text') {
      throw new Error('Claude returned no text for generateWeeklyAnalysis');
    }

    return firstBlock.text.trim();
  } catch (err) {
    console.error('[weekly] generateWeeklyAnalysis failed:', err);
    throw err;
  }
}
