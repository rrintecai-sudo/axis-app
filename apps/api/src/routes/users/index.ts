import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '@axis/db';
import { NOT_FOUND, VALIDATION_ERROR } from '../../errors.js';

interface UserIdParams {
  id: string;
}

interface CreateUserBody {
  email: string;
  name?: string;
  phone?: string;
  timezone?: string;
}

interface UpdateProfileBody {
  roles?: string[];
  values?: string[];
  q1Goals?: string[];
  topPriority?: string;
  wakeUpTime?: string;
  sleepTime?: string;
}

const userRoutes: FastifyPluginAsync = async (fastify) => {
  // ------------------------------------------------------------------
  // GET /users/:id — Get user with profile
  // ------------------------------------------------------------------
  fastify.get<{ Params: UserIdParams }>('/users/:id', async (request, reply) => {
    const { id } = request.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: {
          include: { lifeAreas: true },
        },
        subscription: true,
      },
    });

    if (!user) {
      throw NOT_FOUND('User');
    }

    return reply.code(200).send({ success: true, data: user });
  });

  // ------------------------------------------------------------------
  // POST /users — Create a user
  // ------------------------------------------------------------------
  fastify.post<{ Body: CreateUserBody }>('/users', async (request, reply) => {
    const { email, name, phone, timezone } = request.body;

    if (!email || typeof email !== 'string') {
      throw VALIDATION_ERROR('email is required');
    }

    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        email,
        name: name ?? null,
        phone: phone ?? null,
        timezone: timezone ?? 'America/New_York',
        trialEndsAt,
        subscription: {
          create: {
            status: 'TRIAL',
          },
        },
      },
      include: {
        subscription: true,
      },
    });

    return reply.code(201).send({ success: true, data: user });
  });

  // ------------------------------------------------------------------
  // PATCH /users/:id/profile — Update user profile
  // ------------------------------------------------------------------
  fastify.patch<{ Params: UserIdParams; Body: UpdateProfileBody }>(
    '/users/:id/profile',
    async (request, reply) => {
      const { id } = request.params;
      const body = request.body;

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw NOT_FOUND('User');
      }

      const profile = await prisma.userProfile.upsert({
        where: { userId: id },
        update: {
          ...(body.roles !== undefined ? { roles: body.roles } : {}),
          ...(body.values !== undefined ? { values: body.values } : {}),
          ...(body.q1Goals !== undefined ? { q1Goals: body.q1Goals } : {}),
          ...(body.topPriority !== undefined ? { topPriority: body.topPriority } : {}),
          ...(body.wakeUpTime !== undefined ? { wakeUpTime: body.wakeUpTime } : {}),
          ...(body.sleepTime !== undefined ? { sleepTime: body.sleepTime } : {}),
        },
        create: {
          userId: id,
          roles: body.roles ?? [],
          values: body.values ?? [],
          q1Goals: body.q1Goals ?? [],
          topPriority: body.topPriority ?? null,
          wakeUpTime: body.wakeUpTime ?? '07:00',
          sleepTime: body.sleepTime ?? '22:00',
        },
      });

      return reply.code(200).send({ success: true, data: profile });
    },
  );
};

export default userRoutes;
