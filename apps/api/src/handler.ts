import { buildApp } from './app.js';
import type { IncomingMessage, ServerResponse } from 'node:http';

// Reuse across warm invocations
let fastify: Awaited<ReturnType<typeof buildApp>> | null = null;

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!fastify) {
    fastify = await buildApp();
    await fastify.ready();
  }
  fastify.server.emit('request', req, res);
}
