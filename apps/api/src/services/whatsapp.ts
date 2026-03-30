import { env } from '../env.js';

const GRAPH_API_URL = `https://graph.facebook.com/v18.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

interface WhatsAppTextPayload {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text';
  text: {
    body: string;
    preview_url?: boolean;
  };
}

async function postToWhatsApp(payload: WhatsAppTextPayload): Promise<void> {
  const response = await fetch(GRAPH_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`WhatsApp API error ${response.status}: ${body}`);
  }
}

/**
 * Sends a plain text message via WhatsApp Cloud API.
 */
export async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  const payload: WhatsAppTextPayload = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text },
  };

  await postToWhatsApp(payload);
}

/**
 * Sends a formatted message. WhatsApp natively renders *bold* with asterisks,
 * so we pass the text as-is — callers should use WhatsApp markdown.
 */
export async function sendFormattedMessage(to: string, text: string): Promise<void> {
  const payload: WhatsAppTextPayload = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text },
  };

  await postToWhatsApp(payload);
}
