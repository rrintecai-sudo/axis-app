import { prisma } from '@axis/db';
import type { Task } from '@axis/db';
import { openai, MODEL } from './client.js';
import { buildUserProfileContext } from './context.js';

// ---------------------------------------------------------------------------
// Prioritize tasks with AI
// ---------------------------------------------------------------------------

export async function prioritizeTasks(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: { lifeAreas: true },
      },
      tasks: {
        where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
      },
    },
  });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  if (!user.tasks || user.tasks.length === 0) {
    return;
  }

  const profileContext = user.profile
    ? buildUserProfileContext(user.profile)
    : 'Perfil no disponible.';

  const goalsContext =
    user.profile && user.profile.q1Goals.length > 0
      ? user.profile.q1Goals.join('\n')
      : 'Sin objetivos registrados.';

  const tasksJson = user.tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description ?? '',
    lifeArea: t.lifeArea ?? '',
    dueDate: t.dueDate ? t.dueDate.toISOString().split('T')[0] : null,
  }));

  const systemPrompt = `Eres un experto en productividad y priorización. Tu trabajo es evaluar una lista de tareas para un usuario específico y asignarles prioridad e impacto basándote en sus objetivos reales.

Devuelve ÚNICAMENTE un JSON válido con este formato, sin texto adicional:
[
  {
    "id": "id_de_la_tarea",
    "priority": 8,
    "impact": 9,
    "aiReason": "Explicación breve de por qué esta tarea tiene esta prioridad (máx 100 caracteres)"
  }
]

Reglas:
- priority: del 1 al 10 (10 = más urgente/importante para hacer ahora)
- impact: del 1 al 10 (10 = mayor impacto positivo en los objetivos del usuario)
- aiReason: máximo 100 caracteres, en español, explicando la lógica
- Considera: alineación con objetivos del trimestre, fechas límite, áreas de vida activas
- Sé honesto: no todas las tareas son críticas`;

  const userContent = `## Perfil del usuario
${profileContext}

## Objetivos del trimestre
${goalsContext}

## Tareas a evaluar
${JSON.stringify(tasksJson, null, 2)}`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('OpenAI returned no text for prioritizeTasks');

    const raw = content.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      throw new Error('Claude did not return an array for prioritizeTasks');
    }

    for (const item of parsed) {
      if (
        typeof item !== 'object' ||
        item === null ||
        !('id' in item) ||
        !('priority' in item) ||
        !('impact' in item)
      ) {
        continue;
      }

      const record = item as Record<string, unknown>;
      const id = record['id'];
      const priority = record['priority'];
      const impact = record['impact'];
      const aiReason = record['aiReason'];

      if (typeof id !== 'string') continue;

      const updateData: {
        priority?: number;
        impact?: number;
        aiReason?: string;
      } = {};

      if (typeof priority === 'number') updateData.priority = Math.round(priority);
      if (typeof impact === 'number') updateData.impact = Math.round(impact);
      if (typeof aiReason === 'string') updateData.aiReason = aiReason;

      await prisma.task.update({
        where: { id },
        data: updateData,
      });
    }
  } catch (err) {
    console.error('[prioritize] prioritizeTasks failed:', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Get today's tasks
// ---------------------------------------------------------------------------

export async function getTodaysTasks(userId: string): Promise<Task[]> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  try {
    // Fetch tasks that are:
    // a) scheduled for today, OR
    // b) due today or overdue, OR
    // c) pending with no date (ordered by priority)
    const allTasks = await prisma.task.findMany({
      where: {
        userId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      orderBy: [
        { isTopTask: 'desc' },
        { priority: 'desc' },
        { impact: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    const todayTasks: Task[] = [];
    const otherTasks: Task[] = [];

    for (const task of allTasks) {
      const scheduledToday =
        task.scheduledFor !== null &&
        task.scheduledFor >= todayStart &&
        task.scheduledFor <= todayEnd;

      const dueToday =
        task.dueDate !== null && task.dueDate <= todayEnd;

      if (scheduledToday || dueToday) {
        todayTasks.push(task);
      } else if (task.scheduledFor === null && task.dueDate === null) {
        otherTasks.push(task);
      }
    }

    // Top tasks first, then date-constrained, then undated by priority
    const topTasks = todayTasks.filter((t) => t.isTopTask);
    const regularTodayTasks = todayTasks.filter((t) => !t.isTopTask);
    const topUndated = otherTasks.filter((t) => t.isTopTask);
    const regularUndated = otherTasks.filter((t) => !t.isTopTask);

    return [
      ...topTasks,
      ...topUndated,
      ...regularTodayTasks,
      ...regularUndated.slice(0, 5), // Cap undated tasks at 5
    ];
  } catch (err) {
    console.error('[prioritize] getTodaysTasks failed:', err);
    throw err;
  }
}
