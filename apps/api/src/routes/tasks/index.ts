import type { FastifyPluginAsync } from 'fastify';
import { prisma, type TaskStatus } from '@axis/db';
import { AppError, NOT_FOUND, VALIDATION_ERROR } from '../../errors.js';

interface CreateTaskBody {
  userId: string;
  title: string;
  description?: string;
  lifeArea?: string;
  dueDate?: string;
}

interface UpdateTaskBody {
  title?: string;
  description?: string;
  lifeArea?: string;
  priority?: number;
  impact?: number;
  dueDate?: string;
  scheduledFor?: string;
  status?: TaskStatus;
  isTopTask?: boolean;
}

interface TaskIdParams {
  id: string;
}

interface TaskListQuery {
  userId: string;
  status?: TaskStatus;
  lifeArea?: string;
}

interface TodayTasksQuery {
  userId: string;
}

const taskRoutes: FastifyPluginAsync = async (fastify) => {
  // ------------------------------------------------------------------
  // POST /tasks — Create a task
  // ------------------------------------------------------------------
  fastify.post<{ Body: CreateTaskBody }>('/tasks', async (request, reply) => {
    const { userId, title, description, lifeArea, dueDate } = request.body;

    if (!userId || typeof userId !== 'string') {
      throw VALIDATION_ERROR('userId is required');
    }
    if (!title || typeof title !== 'string') {
      throw VALIDATION_ERROR('title is required');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw NOT_FOUND('User');
    }

    const task = await prisma.task.create({
      data: {
        userId,
        title,
        description: description ?? null,
        lifeArea: lifeArea ?? null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    // Trigger AI prioritization in background
    void (async () => {
      try {
        const { prioritizeTasks } = await import('@axis/ai');
        await prioritizeTasks(userId);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        request.log.error(`[tasks] prioritizeTasks failed for user ${userId}: ${message}`);
      }
    })();

    return reply.code(201).send({ success: true, data: task });
  });

  // ------------------------------------------------------------------
  // GET /tasks — List tasks
  // ------------------------------------------------------------------
  fastify.get<{ Querystring: TaskListQuery }>('/tasks', async (request, reply) => {
    const { userId, status, lifeArea } = request.query;

    if (!userId) {
      throw VALIDATION_ERROR('userId query param is required');
    }

    const tasks = await prisma.task.findMany({
      where: {
        userId,
        ...(status !== undefined ? { status } : {}),
        ...(lifeArea !== undefined ? { lifeArea } : {}),
      },
      orderBy: { priority: 'desc' },
    });

    return reply.code(200).send({ success: true, data: tasks });
  });

  // ------------------------------------------------------------------
  // GET /tasks/today — Today's tasks
  // ------------------------------------------------------------------
  fastify.get<{ Querystring: TodayTasksQuery }>('/tasks/today', async (request, reply) => {
    const { userId } = request.query;

    if (!userId) {
      throw VALIDATION_ERROR('userId query param is required');
    }

    try {
      const { getTodaysTasks } = await import('@axis/ai');
      const tasks = await getTodaysTasks(userId);
      return reply.code(200).send({ success: true, data: tasks });
    } catch (err: unknown) {
      if (err instanceof AppError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      request.log.error(`[tasks] getTodaysTasks failed: ${message}`);
      // Fallback: return pending tasks ordered by priority
      const tasks = await prisma.task.findMany({
        where: { userId, status: 'PENDING' },
        orderBy: [{ isTopTask: 'desc' }, { priority: 'desc' }],
        take: 10,
      });
      return reply.code(200).send({ success: true, data: tasks });
    }
  });

  // ------------------------------------------------------------------
  // PATCH /tasks/:id — Update a task
  // ------------------------------------------------------------------
  fastify.patch<{ Params: TaskIdParams; Body: UpdateTaskBody }>(
    '/tasks/:id',
    async (request, reply) => {
      const { id } = request.params;
      const body = request.body;

      const existing = await prisma.task.findUnique({ where: { id } });
      if (!existing) {
        throw NOT_FOUND('Task');
      }

      const completedAt =
        body.status === 'DONE' && existing.status !== 'DONE' ? new Date() : undefined;

      const updated = await prisma.task.update({
        where: { id },
        data: {
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.lifeArea !== undefined ? { lifeArea: body.lifeArea } : {}),
          ...(body.priority !== undefined ? { priority: body.priority } : {}),
          ...(body.impact !== undefined ? { impact: body.impact } : {}),
          ...(body.dueDate !== undefined
            ? { dueDate: body.dueDate ? new Date(body.dueDate) : null }
            : {}),
          ...(body.scheduledFor !== undefined
            ? { scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null }
            : {}),
          ...(body.status !== undefined ? { status: body.status } : {}),
          ...(body.isTopTask !== undefined ? { isTopTask: body.isTopTask } : {}),
          ...(completedAt !== undefined ? { completedAt } : {}),
        },
      });

      return reply.code(200).send({ success: true, data: updated });
    },
  );

  // ------------------------------------------------------------------
  // DELETE /tasks/:id — Delete a task
  // ------------------------------------------------------------------
  fastify.delete<{ Params: TaskIdParams }>('/tasks/:id', async (request, reply) => {
    const { id } = request.params;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      throw NOT_FOUND('Task');
    }

    await prisma.task.delete({ where: { id } });

    return reply.code(200).send({ success: true, data: { id } });
  });
};

export default taskRoutes;
