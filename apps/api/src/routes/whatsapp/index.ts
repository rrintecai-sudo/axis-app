import crypto from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import { waitUntil } from '@vercel/functions';
import { prisma } from '@axis/db';
import { env } from '../../env.js';
import { sendWhatsAppMessage } from '../../services/whatsapp.js';

// ---------------------------------------------------------------------------
// Types for Meta WhatsApp Cloud API payload
// ---------------------------------------------------------------------------
interface WhatsAppTextMessage {
  id: string;
  from: string;
  timestamp: string;
  type: 'text';
  text: { body: string };
}

interface WhatsAppOtherMessage {
  id: string;
  from: string;
  timestamp: string;
  type: Exclude<string, 'text'>;
}

type WhatsAppMessage = WhatsAppTextMessage | WhatsAppOtherMessage;

interface MetaWebhookPayload {
  object: string;
  entry: Array<{
    changes: Array<{
      value: {
        messages?: WhatsAppMessage[];
        [key: string]: unknown;
      };
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidSignature(rawBody: string, signature: string): boolean {
  try {
    const expected = `sha256=${crypto
      .createHmac('sha256', env.WHATSAPP_APP_SECRET)
      .update(rawBody)
      .digest('hex')}`;
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

async function processIncomingMessage(
  phoneNumber: string,
  messageText: string,
  whatsappMessageId: string,
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { phone: phoneNumber },
    });

    if (!user) {
      // Create a basic user record and send welcome message
      const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const newUser = await prisma.user.create({
        data: {
          email: `${phoneNumber}@whatsapp.temp`,
          phone: phoneNumber,
          trialEndsAt,
          subscription: {
            create: {
              status: 'TRIAL',
            },
          },
        },
      });

      void newUser; // used for creation side-effect

      await sendWhatsAppMessage(
        phoneNumber,
        `Hola, soy *AXIS* — tu asistente personal de vida.\n\nEstoy aquí para ayudarte a vivir con dirección, enfoque y propósito — no solo a estar ocupado.\n\n¿Cómo te llamas y en qué puedo ayudarte hoy?`,
      );
      return;
    }

    // Import chat dynamically to avoid circular dependency issues
    const { chat } = await import('@axis/ai');
    const response = await chat(user.id, messageText);

    await sendWhatsAppMessage(phoneNumber, response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[whatsapp] processIncomingMessage error for ${phoneNumber}: ${message}`);
  }
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

const whatsappRoutes: FastifyPluginAsync = async (fastify) => {
  // ------------------------------------------------------------------
  // GET /whatsapp/webhook — Meta verification challenge
  // ------------------------------------------------------------------
  fastify.get<{
    Querystring: {
      'hub.mode'?: string;
      'hub.verify_token'?: string;
      'hub.challenge'?: string;
    };
  }>('/whatsapp/webhook', async (request, reply) => {
    const mode = request.query['hub.mode'];
    const token = request.query['hub.verify_token'];
    const challenge = request.query['hub.challenge'];

    if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN) {
      request.log.info('[whatsapp] Webhook verified by Meta');
      return reply.code(200).send(challenge);
    }

    return reply.code(403).send({ error: 'Forbidden' });
  });

  // ------------------------------------------------------------------
  // POST /whatsapp/webhook — Incoming messages from Meta
  // ------------------------------------------------------------------
  fastify.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (req, body, done) => {
      try {
        done(null, body);
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        done(error, undefined);
      }
    },
  );

  fastify.post('/whatsapp/webhook', async (request, reply) => {
    // Always respond 200 immediately — Meta drops the webhook if > 5s
    void reply.code(200).send({ received: true });

    const rawBody = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);

    // Validate HMAC signature
    const signature = request.headers['x-hub-signature-256'];
    request.log.info(`[whatsapp] signature header: ${signature ?? 'MISSING'}`);
    if (typeof signature !== 'string') {
      request.log.warn('[whatsapp] No x-hub-signature-256 header — ignoring payload');
      return;
    }
    const sigValid = isValidSignature(rawBody, signature);
    request.log.info(`[whatsapp] HMAC valid: ${sigValid}`);
    if (!sigValid) {
      request.log.warn('[whatsapp] Invalid HMAC — ignoring payload');
      return;
    }

    let payload: MetaWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as MetaWebhookPayload;
    } catch {
      request.log.warn('[whatsapp] Failed to parse webhook JSON body');
      return;
    }

    const message = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    request.log.info(`[whatsapp] message: ${JSON.stringify(message ?? null)}`);

    if (!message) {
      request.log.info('[whatsapp] No message field — status update or read receipt, skipping');
      return;
    }

    if (message.type !== 'text') {
      request.log.info(`[whatsapp] Ignoring non-text message type: ${message.type}`);
      return;
    }

    const textMessage = message as WhatsAppTextMessage;
    const phoneNumber = textMessage.from;
    const messageText = textMessage.text.body;
    const whatsappMessageId = textMessage.id;

    request.log.info(`[whatsapp] Processing message from ${phoneNumber}: "${messageText}"`);

    // Keep function alive until processing completes (Vercel waitUntil)
    waitUntil(processIncomingMessage(phoneNumber, messageText, whatsappMessageId));
  });
};

export default whatsappRoutes;
