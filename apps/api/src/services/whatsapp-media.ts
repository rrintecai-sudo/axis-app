import { env } from '../env.js';

interface MediaInfo {
  url: string;
  mime_type: string;
  file_size?: number;
}

/**
 * Step 1: Ask Meta for the download URL of a media object by its ID.
 */
export async function getMediaInfo(mediaId: string): Promise<MediaInfo> {
  const res = await fetch(`https://graph.facebook.com/v18.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Meta media info error ${res.status}: ${body}`);
  }

  return res.json() as Promise<MediaInfo>;
}

/**
 * Step 2: Download the actual binary from the URL returned in step 1.
 */
export async function downloadMedia(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Media download error ${res.status}: ${body}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Convenience: get media info + download in one call.
 */
export async function fetchWhatsAppMedia(mediaId: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const info = await getMediaInfo(mediaId);
  const buffer = await downloadMedia(info.url);
  return { buffer, mimeType: info.mime_type };
}
