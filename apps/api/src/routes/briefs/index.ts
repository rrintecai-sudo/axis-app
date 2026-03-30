import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '@axis/db';
import { NOT_FOUND, VALIDATION_ERROR } from '../../errors.js';

interface BriefQuery {
  userId: string;
}

interface GenerateBriefBody {
  userId: string;
}

function startOfDayUTC(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function endOfDayUTC(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

const briefRoutes: FastifyPluginAsync = async (fastify) => {
  // ------------------------------------------------------------------
  // GET /briefs — List briefs for a user
  // ------------------------------------------------------------------
  fastify.get<{ Querystring: BriefQuery }>('/briefs', async (request, reply) => {
    const { userId } = request.query;

    if (!userId) {
      throw VALIDATION_ERROR('userId query param is required');
    }

    const briefs = await prisma.brief.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    return reply.code(200).send({ success: true, data: briefs });
  });

  // ------------------------------------------------------------------
  // GET /briefs/today — Get today's brief or generate if missing
  // ------------------------------------------------------------------
  fastify.get<{ Querystring: BriefQuery }>('/briefs/today', async (request, reply) => {
    const { userId } = request.query;

    if (!userId) {
      throw VALIDATION_ERROR('userId query param is required');
    }

    const now = new Date();

    // First try to find an existing brief from DB
    const todayBrief = await prisma.brief.findFirst({
      where: {
        userId,
        date: {
          gte: startOfDayUTC(now),
          lte: endOfDayUTC(now),
        },
      },
    });

    if (todayBrief) {
      return reply.code(200).send({ success: true, data: todayBrief });
    }

    // Generate via AI (generateBrief handles the DB upsert internally)
    try {
      const { generateBrief } = await import('@axis/ai');
      const brief = await generateBrief(userId, now);
      return reply.code(200).send({ success: true, data: brief });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      request.log.error(`[briefs] generateBrief failed: ${message}`);
      throw NOT_FOUND('Brief for today');
    }
  });

  // ------------------------------------------------------------------
  // POST /briefs/generate — Explicitly generate a brief
  // ------------------------------------------------------------------
  fastify.post<{ Body: GenerateBriefBody }>('/briefs/generate', async (request, reply) => {
    const { userId } = request.body;

    if (!userId) {
      throw VALIDATION_ERROR('userId is required');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw NOT_FOUND('User');
    }

    // generateBrief upserts the Brief in the DB and returns it
    const { generateBrief } = await import('@axis/ai');
    const brief = await generateBrief(userId, new Date());

    return reply.code(201).send({ success: true, data: brief });
  });
};

export default briefRoutes;
