import { prisma } from '@axis/db';
import type { Memory, MemoryCategory } from '@axis/db';
import { anthropic, MODEL } from './client.js';

// ---------------------------------------------------------------------------
// Embedding
// ---------------------------------------------------------------------------

async function generateEmbeddingViaOpenAI(text: string): Promise<number[]> {
  const apiKey = process.env['OPENAI_API_KEY'];
  if (!apiKey) {
    // Dev fallback: return 1536 zeros — semantic search won't work but system starts
    return new Array<number>(1536).fill(0);
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI embeddings error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as {
    data: Array<{ embedding: number[] }>;
  };

  const embedding = data.data[0]?.embedding;
  if (!embedding) {
    throw new Error('OpenAI embeddings returned no vector');
  }

  return embedding;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    return await generateEmbeddingViaOpenAI(text);
  } catch (err) {
    console.error('[memory] generateEmbedding failed, using zero vector:', err);
    return new Array<number>(1536).fill(0);
  }
}

// ---------------------------------------------------------------------------
// Save memory
// ---------------------------------------------------------------------------

export async function saveMemory(
  userId: string,
  content: string,
  category: MemoryCategory,
): Promise<Memory> {
  try {
    const embedding = await generateEmbedding(content);

    // pgvector expects the format '[0.1,0.2,...]'
    const vectorStr = `[${embedding.join(',')}]`;

    const memory = await prisma.$queryRaw<Memory[]>`
      INSERT INTO "Memory" ("id", "userId", "content", "embedding", "category", "relevance", "createdAt")
      VALUES (
        gen_random_uuid()::text,
        ${userId},
        ${content},
        ${vectorStr}::vector,
        ${category}::"MemoryCategory",
        1.0,
        NOW()
      )
      RETURNING *
    `;

    const saved = memory[0];
    if (!saved) {
      throw new Error('INSERT into Memory returned no rows');
    }

    return saved;
  } catch (err) {
    console.error('[memory] saveMemory failed:', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Retrieve relevant memories
// ---------------------------------------------------------------------------

export async function retrieveRelevantMemories(
  userId: string,
  query: string,
  limit = 5,
): Promise<Memory[]> {
  try {
    const embedding = await generateEmbedding(query);

    // If the vector is all zeros (dev fallback) skip semantic search
    const isZeroVector = embedding.every((v) => v === 0);

    if (isZeroVector) {
      return await prisma.memory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    }

    const vectorStr = `[${embedding.join(',')}]`;

    const memories = await prisma.$queryRaw<Memory[]>`
      SELECT *
      FROM "Memory"
      WHERE "userId" = ${userId}
      ORDER BY embedding <-> ${vectorStr}::vector
      LIMIT ${limit}
    `;

    return memories;
  } catch (err) {
    console.error('[memory] retrieveRelevantMemories failed, falling back to recent:', err);

    try {
      return await prisma.memory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (fallbackErr) {
      console.error('[memory] fallback also failed:', fallbackErr);
      return [];
    }
  }
}

// ---------------------------------------------------------------------------
// Extract memories from conversation using Claude
// ---------------------------------------------------------------------------

export async function extractMemoriesFromConversation(
  messages: { role: string; content: string }[],
): Promise<Array<{ content: string; category: MemoryCategory }>> {
  if (messages.length === 0) return [];

  const transcript = messages
    .map((m) => {
      const label = m.role === 'USER' || m.role === 'user' ? 'Usuario' : 'AXIS';
      return `${label}: ${m.content}`;
    })
    .join('\n');

  const systemPrompt = `Eres un sistema de extracción de memoria. Analiza la conversación y extrae los fragmentos de información que vale la pena recordar a largo plazo sobre el usuario.

Devuelve ÚNICAMENTE un JSON válido con este formato, sin explicaciones adicionales:
[
  { "content": "texto de la memoria", "category": "CATEGORÍA" }
]

Categorías disponibles: GOAL, COMMITMENT, PERSON, INSIGHT, PATTERN, CONTEXT

Reglas:
- GOAL: objetivos o metas mencionados
- COMMITMENT: compromisos o promesas que hizo el usuario
- PERSON: información sobre personas importantes para el usuario
- INSIGHT: reflexiones o aprendizajes del usuario
- PATTERN: comportamientos o patrones recurrentes detectados
- CONTEXT: información de contexto general útil (trabajo, familia, situación)
- Solo extrae información realmente relevante. Si no hay nada relevante, devuelve []
- Máximo 5 memorias por conversación`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Conversación:\n${transcript}`,
        },
      ],
    });

    const firstBlock = response.content[0];
    if (!firstBlock || firstBlock.type !== 'text') return [];

    const raw = firstBlock.text.trim();

    // Strip markdown code fences if present
    const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');

    const parsed = JSON.parse(jsonStr) as unknown;

    if (!Array.isArray(parsed)) return [];

    const result: Array<{ content: string; category: MemoryCategory }> = [];

    const validCategories = new Set<string>([
      'GOAL',
      'COMMITMENT',
      'PERSON',
      'INSIGHT',
      'PATTERN',
      'CONTEXT',
    ]);

    for (const item of parsed) {
      if (
        typeof item === 'object' &&
        item !== null &&
        'content' in item &&
        'category' in item &&
        typeof (item as Record<string, unknown>)['content'] === 'string' &&
        typeof (item as Record<string, unknown>)['category'] === 'string' &&
        validCategories.has((item as Record<string, unknown>)['category'] as string)
      ) {
        result.push({
          content: (item as Record<string, unknown>)['content'] as string,
          category: (item as Record<string, unknown>)['category'] as MemoryCategory,
        });
      }
    }

    return result;
  } catch (err) {
    console.error('[memory] extractMemoriesFromConversation failed:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Process and save memories
// ---------------------------------------------------------------------------

export async function processAndSaveMemories(
  userId: string,
  messages: { role: string; content: string }[],
): Promise<void> {
  try {
    const extracted = await extractMemoriesFromConversation(messages);

    for (const { content, category } of extracted) {
      await saveMemory(userId, content, category);
    }
  } catch (err) {
    console.error('[memory] processAndSaveMemories failed:', err);
  }
}
