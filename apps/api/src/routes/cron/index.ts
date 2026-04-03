import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '@axis/db';
import { generateBrief } from '@axis/ai';
import { sendWhatsAppMessage } from '../../services/whatsapp.js';
import { startEveningClose } from '@axis/ai';
import { env } from '../../env.js';

// Vercel Cron llama estos endpoints cada hora.
// Nosotros verificamos qué usuarios necesitan brief/cierre en este momento.

const cronRoutes: FastifyPluginAsync = async (fastify) => {
  // Middleware: verifica que el request viene de Vercel Cron (o de nosotros en dev)
  fastify.addHook('preHandler', async (request, reply) => {
    const secret = request.headers['x-cron-secret'] ?? request.headers['authorization'];
    const expected = `Bearer ${env.CRON_SECRET}`;
    if (secret !== expected) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  // POST /cron/brief — se dispara cada hora
  // Envía el brief a los usuarios cuyo wakeUpTime cae en esta hora
  fastify.post('/cron/brief', async (_request, reply) => {
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();

    // Solo procesar en los primeros 5 minutos de la hora para evitar duplicados
    if (currentMinute > 5) {
      return reply.code(200).send({ skipped: true, reason: 'not in first 5 minutes of hour' });
    }

    try {
      const users = await prisma.user.findMany({
        where: {
          subscriptionStatus: { in: ['ACTIVE', 'TRIAL'] },
          phone: { not: null },
          profile: { isNot: null },
        },
        include: { profile: true },
      });

      const results: string[] = [];

      for (const user of users) {
        if (!user.profile || !user.phone) continue;

        // Parsear wakeUpTime (ej: "06:30") y comparar con la hora UTC actual
        // En producción real considera el timezone del usuario — aquí simplificamos
        const [wakeHour] = user.profile.wakeUpTime.split(':').map(Number);
        if (wakeHour !== currentHour) continue;

        // Verificar que no se haya enviado el brief hoy
        const todayStart = new Date();
        todayStart.setUTCHours(0, 0, 0, 0);

        const existingBrief = await prisma.brief.findFirst({
          where: {
            userId: user.id,
            createdAt: { gte: todayStart },
            sentAt: { not: null },
          },
        });

        if (existingBrief) continue;

        try {
          const brief = await generateBrief(user.id, now);
          await sendWhatsAppMessage(user.phone, brief.content);
          await prisma.brief.update({
            where: { id: brief.id },
            data: { sentAt: new Date() },
          });
          results.push(`✓ Brief enviado a ${user.phone}`);
        } catch (err) {
          fastify.log.error({ userId: user.id, err }, 'Error sending brief');
          results.push(`✗ Error con ${user.phone}`);
        }
      }

      return reply.code(200).send({ processed: results.length, results });
    } catch (err) {
      fastify.log.error(err, 'Cron brief failed');
      return reply.code(500).send({ error: 'Internal error' });
    }
  });

  // POST /cron/reminders — se dispara cada hora
  // Envía recordatorios de tareas cuyo remindAt cae en la ventana actual (±5 min)
  fastify.post('/cron/reminders', async (_request, reply) => {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 5 * 60 * 1000);
    const windowEnd   = new Date(now.getTime() + 5 * 60 * 1000);

    try {
      const tasks = await prisma.task.findMany({
        where: {
          remindAt:   { gte: windowStart, lte: windowEnd },
          remindedAt: null,
          status:     { in: ['PENDING', 'IN_PROGRESS'] },
        },
        include: { user: true },
      });

      const results: string[] = [];

      for (const task of tasks) {
        if (!task.user.phone) continue;

        const message = `⏰ *Recordatorio:* ${task.title}${task.description ? `\n${task.description}` : ''}`;

        try {
          await sendWhatsAppMessage(task.user.phone, message);
          await prisma.task.update({
            where: { id: task.id },
            data:  { remindedAt: new Date() },
          });
          results.push(`✓ Recordatorio enviado a ${task.user.phone}: "${task.title}"`);
        } catch (err) {
          fastify.log.error({ taskId: task.id, err }, 'Error sending reminder');
          results.push(`✗ Error con tarea ${task.id}`);
        }
      }

      return reply.code(200).send({ processed: results.length, results });
    } catch (err) {
      fastify.log.error(err, 'Cron reminders failed');
      return reply.code(500).send({ error: 'Internal error' });
    }
  });

  // POST /cron/evening — se dispara cada hora
  // Envía el cierre nocturno a los usuarios cuyo sleepTime cae en esta hora
  fastify.post('/cron/evening', async (_request, reply) => {
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();

    if (currentMinute > 5) {
      return reply.code(200).send({ skipped: true, reason: 'not in first 5 minutes of hour' });
    }

    try {
      const users = await prisma.user.findMany({
        where: {
          subscriptionStatus: { in: ['ACTIVE', 'TRIAL'] },
          phone: { not: null },
          profile: { isNot: null },
        },
        include: { profile: true },
      });

      const results: string[] = [];

      for (const user of users) {
        if (!user.profile || !user.phone) continue;

        const [sleepHour] = user.profile.sleepTime.split(':').map(Number);
        if (sleepHour !== currentHour) continue;

        try {
          const message = await startEveningClose(user.id);
          await sendWhatsAppMessage(user.phone, message);
          results.push(`✓ Cierre enviado a ${user.phone}`);
        } catch (err) {
          fastify.log.error({ userId: user.id, err }, 'Error sending evening close');
          results.push(`✗ Error con ${user.phone}`);
        }
      }

      return reply.code(200).send({ processed: results.length, results });
    } catch (err) {
      fastify.log.error(err, 'Cron evening failed');
      return reply.code(500).send({ error: 'Internal error' });
    }
  });
};

export default cronRoutes;
