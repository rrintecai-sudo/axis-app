import { prisma } from '@axis/db';
import type { MessageRole } from '@axis/db';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { openai, MODEL, MAX_TOKENS } from './client.js';
import { AXIS_SYSTEM_PROMPT } from './prompts/system.js';
import {
  buildUserProfileContext,
  buildConversationContext,
  buildMemoriesContext,
} from './context.js';
import { retrieveRelevantMemories, processAndSaveMemories } from './memory.js';

function buildUserContext(profile: {
  name: string | null;
  lifeAreas: Array<{ name: string; isActive: boolean; goal90days: string | null }>;
  neglectedArea: string | null;
  wakeUpTime: string;
}): string {
  const areas = profile.lifeAreas
    .filter((a) => a.isActive)
    .map((a) => `- ${a.name}: ${a.goal90days ?? 'sin meta definida aún'}`)
    .join('\n');

  return `## Lo que sé de este usuario

Nombre: ${profile.name ?? 'desconocido'}

Áreas de vida activas y sus metas de 90 días:
${areas || 'Sin áreas definidas aún'}

Área que admitió estar descuidando: ${profile.neglectedArea ?? 'no definida'}

Recibe su guía del día a las: ${profile.wakeUpTime}

## Cómo usar este contexto
- Cuando el usuario mencione trabajo, conecta con su meta de trabajo
- Si el usuario está saturado, prioriza basado en sus áreas y metas
- Si detectas que está ignorando su área descuidada, nómbralo con respeto
- Nunca preguntes cosas que ya sabes de este contexto`.trim();
}

export interface ChatOptions {
  /** Base64-encoded image to send alongside the message (GPT-4o vision) */
  imageBase64?: string;
  imageMimeType?: string;
}

export async function chat(userId: string, userMessage: string, options?: ChatOptions): Promise<string> {
  // 1. Load user with profile and life areas
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          lifeAreas: { orderBy: { priority: 'asc' } },
        },
      },
    },
  });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  // 2. Get or create today's conversation
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

  // 3. Retrieve the last 10 messages from this conversation
  const recentMessages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' },
    take: 10,
  });

  const lastMessages = recentMessages.map((m) => ({
    role: m.role as string,
    content: m.content,
  }));

  // 4. Retrieve top 5 relevant memories
  const memories = await retrieveRelevantMemories(userId, userMessage, 5);

  // 5. Build system prompt by replacing placeholders
  const profile = user.profile;

  // Post-onboarding: usar contexto completo del usuario
  const profileContext = profile && user.onboardingStep >= 6
    ? buildUserContext(profile)
    : profile
      ? buildUserProfileContext(profile)
      : 'El usuario está en proceso de onboarding.';

  const goalsContext =
    profile && profile.q1Goals.length > 0
      ? profile.q1Goals.join('\n')
      : 'Sin objetivos registrados todavía.';

  const memoriesContext = buildMemoriesContext(memories);
  const conversationContext = buildConversationContext(lastMessages);

  const systemPrompt = AXIS_SYSTEM_PROMPT.replace('{USER_PROFILE}', profileContext)
    .replace('{USER_GOALS}', goalsContext)
    .replace('{RELEVANT_MEMORIES}', memoriesContext)
    .replace('{CONVERSATION_CONTEXT}', conversationContext);

  // 6. Save user message to DB
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: 'USER' as MessageRole,
      content: userMessage,
    },
  });

  // 7. Build messages array for OpenAI (full history + new user message)
  const openaiMessages: ChatCompletionMessageParam[] = [];

  for (const m of lastMessages) {
    if (m.role === 'USER' || m.role === 'user') {
      openaiMessages.push({ role: 'user', content: m.content });
    } else {
      openaiMessages.push({ role: 'assistant', content: m.content });
    }
  }

  // Add the current user message (with optional image for GPT-4o vision)
  if (options?.imageBase64 && options?.imageMimeType) {
    const imageUrl = `data:${options.imageMimeType};base64,${options.imageBase64}`;
    openaiMessages.push({
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: imageUrl } },
        ...(userMessage ? [{ type: 'text' as const, text: userMessage }] : []),
      ],
    });
  } else {
    openaiMessages.push({ role: 'user', content: userMessage });
  }

  // 8. Call OpenAI
  let assistantText: string;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        { role: 'system', content: systemPrompt },
        ...openaiMessages,
      ],
    });

    const choice = response.choices[0];
    if (!choice?.message?.content) {
      throw new Error('OpenAI returned no text content');
    }

    assistantText = choice.message.content;
  } catch (err) {
    console.error('[chat] OpenAI API call failed:', err);
    throw err;
  }

  // 9. Save assistant response to DB
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: 'ASSISTANT' as MessageRole,
      content: assistantText,
    },
  });

  // 10. Process memories in background (fire and forget)
  const userMsg = { role: 'USER', content: userMessage };
  const assistantMsg = { role: 'ASSISTANT', content: assistantText };

  void processAndSaveMemories(userId, [...lastMessages, userMsg, assistantMsg]);

  // 11. Return Claude's response
  return assistantText;
}
