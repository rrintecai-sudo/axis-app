import crypto from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import { waitUntil } from '@vercel/functions';
import { prisma } from '@axis/db';
import { env } from '../../env.js';
import { sendWhatsAppMessage } from '../../services/whatsapp.js';
import { fetchWhatsAppMedia } from '../../services/whatsapp-media.js';
import { handleOnboardingMessage } from '../../services/onboarding.service.js';

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

interface WhatsAppAudioMessage {
  id: string;
  from: string;
  timestamp: string;
  type: 'audio';
  audio: { id: string; mime_type: string };
}

interface WhatsAppImageMessage {
  id: string;
  from: string;
  timestamp: string;
  type: 'image';
  image: { id: string; mime_type: string; caption?: string };
}

interface WhatsAppDocumentMessage {
  id: string;
  from: string;
  timestamp: string;
  type: 'document';
  document: { id: string; filename: string; mime_type: string; caption?: string };
}

interface WhatsAppOtherMessage {
  id: string;
  from: string;
  timestamp: string;
  type: Exclude<string, 'text' | 'audio' | 'image' | 'document'>;
}

type WhatsAppMessage =
  | WhatsAppTextMessage
  | WhatsAppAudioMessage
  | WhatsAppImageMessage
  | WhatsAppDocumentMessage
  | WhatsAppOtherMessage;

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

async function getOrCreateUser(phoneNumber: string) {
  const existing = await prisma.user.findUnique({ where: { phone: phoneNumber } });
  if (existing) return { user: existing, isNew: false };

  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const user = await prisma.user.create({
    data: {
      email: `${phoneNumber}@whatsapp.temp`,
      phone: phoneNumber,
      trialEndsAt,
      subscription: { create: { status: 'TRIAL' } },
    },
  });
  return { user, isNew: true };
}

async function processIncomingMessage(
  phoneNumber: string,
  message: WhatsAppMessage,
): Promise<void> {
  try {
    const { user, isNew } = await getOrCreateUser(phoneNumber);

    const { chat, transcribeAudio } = await import('@axis/ai');

    // Onboarding activo — todos los mensajes van al flujo de onboarding
    if (user.onboardingStep < 6) {
      const text = message.type === 'text' ? message.text.body : '';
      const response = await handleOnboardingMessage(user, text);
      await sendWhatsAppMessage(phoneNumber, response);
      return;
    }

    if (message.type === 'text') {
      const response = await chat(user.id, message.text.body);
      await sendWhatsAppMessage(phoneNumber, response);
      return;
    }

    if (message.type === 'audio') {
      await sendWhatsAppMessage(phoneNumber, '🎙️ _Escuchando tu nota de voz..._');
      const { buffer, mimeType } = await fetchWhatsAppMedia(message.audio.id);
      const transcription = await transcribeAudio(buffer, mimeType);
      console.log(`[whatsapp] Audio transcribed for ${phoneNumber}: "${transcription}"`);
      const response = await chat(user.id, transcription);
      await sendWhatsAppMessage(phoneNumber, response);
      return;
    }

    if (message.type === 'image') {
      await sendWhatsAppMessage(phoneNumber, '🖼️ _Analizando imagen..._');
      const { buffer, mimeType } = await fetchWhatsAppMedia(message.image.id);
      const imageBase64 = buffer.toString('base64');
      const caption = message.image.caption ?? 'Analiza esta imagen y dime qué ves';
      const response = await chat(user.id, caption, { imageBase64, imageMimeType: mimeType });
      await sendWhatsAppMessage(phoneNumber, response);
      return;
    }

    if (message.type === 'document') {
      await sendWhatsAppMessage(
        phoneNumber,
        `📄 Recibí tu documento *${message.document.filename}*. Por ahora solo proceso texto e imágenes — pronto podré leer documentos también.`,
      );
      return;
    }

    // Any other type (sticker, location, etc.)
    await sendWhatsAppMessage(
      phoneNumber,
      'Recibí tu mensaje, pero por ahora solo proceso texto, notas de voz e imágenes.',
    );
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[whatsapp] processIncomingMessage error for ${phoneNumber}: ${errMsg}`);
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

    const message = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0] as WhatsAppMessage | undefined;
    request.log.info(`[whatsapp] message type: ${message?.type ?? 'none'}`);

    if (!message) {
      request.log.info('[whatsapp] No message field — status update or read receipt, skipping');
      return;
    }

    request.log.info(`[whatsapp] Processing ${message.type} message from ${message.from}`);

    // Keep function alive until processing completes (Vercel waitUntil)
    waitUntil(processIncomingMessage(message.from, message));
  });
};

export default whatsappRoutes;
