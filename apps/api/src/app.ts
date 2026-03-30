import Fastify from 'fastify';
import cors from '@fastify/cors';
import { ZodError } from 'zod';
import { AppError } from './errors.js';
import healthRoute from './routes/health.js';
import whatsappRoutes from './routes/whatsapp/index.js';
import taskRoutes from './routes/tasks/index.js';
import briefRoutes from './routes/briefs/index.js';
import userRoutes from './routes/users/index.js';
import stripeRoutes from './routes/stripe/index.js';

export async function buildApp(): Promise<ReturnType<typeof Fastify>> {
  const isDev = process.env['NODE_ENV'] !== 'production';

  const fastify = Fastify({
    logger: isDev
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          },
          level: process.env['LOG_LEVEL'] ?? 'info',
        }
      : {
          level: process.env['LOG_LEVEL'] ?? 'info',
        },
  });

  // ---------------------------------------------------------------------------
  // CORS
  // ---------------------------------------------------------------------------
  await fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ---------------------------------------------------------------------------
  // Global error handler
  // ---------------------------------------------------------------------------
  fastify.setErrorHandler((error, request, reply) => {
    // AppError — known business errors
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    // Zod validation errors
    if (error instanceof ZodError) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.flatten().fieldErrors,
        },
      });
    }

    // Fastify validation errors (JSON schema)
    if (error.validation) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      });
    }

    // Unhandled errors — log and return 500
    request.log.error(error, 'Unhandled error');
    return reply.code(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  });

  // ---------------------------------------------------------------------------
  // Routes
  // ---------------------------------------------------------------------------
  await fastify.register(healthRoute);
  await fastify.register(whatsappRoutes);
  await fastify.register(taskRoutes);
  await fastify.register(briefRoutes);
  await fastify.register(userRoutes);
  await fastify.register(stripeRoutes);

  return fastify;
}
