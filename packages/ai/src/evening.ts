import { prisma } from '@axis/db';
import type { MessageRole } from '@axis/db';

const EVENING_CLOSE_TRIGGER =
  'Buenas noches. Antes de cerrar el día, ¿lograste tu tarea más importante de hoy?';

// ---------------------------------------------------------------------------
// Start evening close
// ---------------------------------------------------------------------------

export async function startEveningClose(userId: string): Promise<string> {
  // Get or create today's conversation
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  let conversation = await prisma.conversation.findFirst({
    where: {
      userId,
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        userId,
        channel: 'WHATSAPP',
      },
    });
  }

  // Save the evening close message as an ASSISTANT message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: 'ASSISTANT' as MessageRole,
      content: EVENING_CLOSE_TRIGGER,
    },
  });

  return EVENING_CLOSE_TRIGGER;
}

// ---------------------------------------------------------------------------
// Detect truth mode
// ---------------------------------------------------------------------------

export function isTruthMode(message: string): boolean {
  const normalized = message.toLowerCase().trim();

  return (
    normalized.includes('modo verdad') ||
    normalized.includes('sin filtros') ||
    normalized.includes('sé honesto conmigo') ||
    normalized.includes('se honesto conmigo')
  );
}
