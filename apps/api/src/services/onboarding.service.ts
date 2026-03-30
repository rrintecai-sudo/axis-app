import { prisma } from '@axis/db';
import type { User, UserProfile, LifeArea } from '@axis/db';
import { openai } from '@axis/ai';

// ---------------------------------------------------------------------------
// Mensajes exactos del onboarding v2
// ---------------------------------------------------------------------------

const WELCOME_MESSAGE = `Hola. Soy AXIS.

Soy tu socio de vida personal. Estoy aquí para acompañarte todos los días — no solo para mandarte un mensaje en la mañana.

Esto es lo que puedo hacer contigo:

📋 *Guía del día* — Cada mañana te digo exactamente qué 3 cosas hacer hoy
💬 *Siempre disponible* — Escríbeme cuando estés saturado y no sepas por dónde empezar
🧠 *Tu espacio para pensar* — Cuéntame lo que tienes en la cabeza, te ayudo a ordenarlo
🌙 *Cierre del día* — Cada noche te hago una reflexión rápida de cómo estuvo
👁 *Te cuido la espalda* — Noto cuando estás descuidando algo importante y te lo digo

Para poder ayudarte bien, necesito conocerte un poco. ¿Cómo te llamas?`;

const NEGLECTED_RESPONSE = `Gracias por decírmelo. Eso importa. ✓

No te voy a dejar ignorar eso.`;

const TIME_QUESTION = `Cada mañana te mando tu *guía del día* — las 3 cosas más importantes que debes hacer, basadas en todo lo que acabas de contarme.

¿A qué hora quieres recibirla?`;

const BASE_AREAS = [
  'Fe/espiritualidad',
  'Matrimonio/pareja',
  'Familia',
  'Trabajo/negocio',
  'Dinero/finanzas',
  'Salud/energía',
  'Crecimiento personal',
];

// Orden de prioridad para preguntar metas
const AREA_PRIORITY_ORDER = [
  'Trabajo/negocio',
  'Dinero/finanzas',
  'Matrimonio/pareja',
  'Familia',
  'Salud/energía',
  'Fe/espiritualidad',
  'Crecimiento personal',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function advanceStep(userId: string, step: number): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { onboardingStep: step } });
}

function extractName(message: string): string {
  return message.trim().split(/\s+/).slice(0, 3).join(' ');
}

function parseTime(message: string): string {
  const cleaned = message.toLowerCase().trim();
  const match = cleaned.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (!match) return '07:00';

  let hours = parseInt(match[1] ?? '7', 10);
  const minutes = parseInt(match[2] ?? '0', 10);
  const meridiem = match[3];

  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

interface LifeAreaInput {
  name: string;
  isCustom: boolean;
}

async function parseAreasWithAI(userMessage: string): Promise<LifeAreaInput[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 300,
    messages: [
      {
        role: 'system',
        content: 'Eres un asistente que extrae áreas de vida de respuestas en lenguaje natural. Responde SOLO con JSON válido, sin texto adicional.',
      },
      {
        role: 'user',
        content: `El usuario respondió esto cuando se le preguntó qué áreas de vida están activas para él: "${userMessage}"

Las áreas base disponibles son: ${BASE_AREAS.join(', ')}

Extrae las áreas activas. Si el usuario dijo "todas", incluye todas. Si el usuario dijo "todas menos X", excluye X. Si mencionó áreas adicionales no en la lista, inclúyelas marcadas como custom. Si mencionó números (1, 2, 4...) mapea por posición en la lista base.

Responde SOLO con JSON válido:
{"areas":[{"name":"Trabajo/negocio","isCustom":false}]}`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const text = response.choices[0]?.message?.content ?? '{"areas":[]}';
  const parsed = JSON.parse(text) as { areas: LifeAreaInput[] };

  // Fallback: si no se parseó nada, activar todas
  if (!parsed.areas || parsed.areas.length === 0) {
    return BASE_AREAS.map((name) => ({ name, isCustom: false }));
  }

  return parsed.areas;
}

async function saveAreas(userId: string, areas: LifeAreaInput[]): Promise<void> {
  let profile = await prisma.userProfile.findUnique({ where: { userId } });

  if (!profile) {
    profile = await prisma.userProfile.create({ data: { userId } });
  }

  // Ordenar según prioridad sugerida
  const sorted = [...areas].sort((a, b) => {
    const ai = AREA_PRIORITY_ORDER.indexOf(a.name);
    const bi = AREA_PRIORITY_ORDER.indexOf(b.name);
    const ap = ai === -1 ? 99 : ai;
    const bp = bi === -1 ? 99 : bi;
    return ap - bp;
  });

  await prisma.lifeArea.createMany({
    data: sorted.map((area, idx) => ({
      profileId: profile!.id,
      name: area.name,
      isCustom: area.isCustom,
      priority: idx + 1,
      isActive: true,
    })),
  });
}

async function getProfile(userId: string): Promise<UserProfile & { lifeAreas: LifeArea[] }> {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    include: { lifeAreas: { orderBy: { priority: 'asc' } } },
  });
  if (!profile) throw new Error(`Profile not found for user ${userId}`);
  return profile;
}

async function handleGoalCollection(user: User, message: string): Promise<string> {
  const profile = await getProfile(user.id);
  const areas = profile.lifeAreas;

  // Encontrar el área actual (la primera sin goal90days)
  const currentArea = areas.find((a) => !a.goal90days);

  if (!currentArea) {
    // Todas las áreas tienen meta — avanzar al paso 4
    await advanceStep(user.id, 4);
    return `Ya tengo el contexto de tus ${areas.length} áreas. ✓

Una última pregunta — y quiero que seas honesto contigo mismo:

¿Cuál de estas áreas sientes que has estado descuidando más?`;
  }

  // Guardar la meta en el área actual
  await prisma.lifeArea.update({
    where: { id: currentArea.id },
    data: { goal90days: message.trim() },
  });

  // Buscar la siguiente área sin meta
  const nextArea = areas.find((a) => a.id !== currentArea.id && !a.goal90days);

  if (!nextArea) {
    // Era la última — avanzar al paso 4
    await advanceStep(user.id, 4);
    return `Ya tengo el contexto de tus ${areas.length} áreas. ✓

Una última pregunta — y quiero que seas honesto contigo mismo:

¿Cuál de estas áreas sientes que has estado descuidando más?`;
  }

  return `Claro. ✓

Ahora *${nextArea.name}*. ¿Qué necesita avanzar ahí en los próximos 90 días?`;
}

function buildAreasMessage(name: string): string {
  return `${name}, en mi experiencia trabajando con personas como tú, la vida de la mayoría gira alrededor de estas áreas:

Fe · Matrimonio/pareja · Familia · Trabajo/negocio · Dinero · Salud · Crecimiento personal

¿Cuáles están activas para ti ahora mismo? Y si tienes alguna que no está en la lista, dímela también.`;
}

function buildFirstGoalMessage(count: number, firstArea: string): string {
  return `${count} áreas activas. ✓

Ahora quiero entender qué importa en cada una. No necesito un plan completo — solo una cosa que necesita avanzar en los próximos 90 días.

Empecemos por *${firstArea}*. ¿Qué es lo más importante que debe pasar ahí?`;
}

function buildClosingMessage(name: string | null, time: string): string {
  const displayName = name ?? 'amigo';
  return `Listo, ${displayName}. Ya te conozco lo suficiente para empezar.

Mañana a las *${time}* recibes tu primera guía del día.

Pero no tienes que esperar hasta mañana. Si ahora mismo tienes algo en la cabeza — una decisión pendiente, algo que te está pesando, lo que sea — escríbeme. Para eso estoy aquí.

Siempre.`;
}

// ---------------------------------------------------------------------------
// Función principal del onboarding
// ---------------------------------------------------------------------------

export async function handleOnboardingMessage(user: User, message: string): Promise<string> {
  switch (user.onboardingStep) {
    case 0: {
      // Primera vez — enviar bienvenida y avanzar a step 1
      await advanceStep(user.id, 1);
      return WELCOME_MESSAGE;
    }

    case 1: {
      // Guardar nombre → presentar áreas
      const name = extractName(message);
      let profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
      if (!profile) {
        profile = await prisma.userProfile.create({ data: { userId: user.id, name } });
      } else {
        await prisma.userProfile.update({ where: { userId: user.id }, data: { name } });
      }
      await advanceStep(user.id, 2);
      return buildAreasMessage(name);
    }

    case 2: {
      // Parsear áreas → pedir meta de la primera
      const areas = await parseAreasWithAI(message);
      await saveAreas(user.id, areas);
      await advanceStep(user.id, 3);
      const firstArea = areas[0]?.name ?? 'Trabajo/negocio';
      return buildFirstGoalMessage(areas.length, firstArea);
    }

    case 3: {
      // Recoger metas área por área
      return handleGoalCollection(user, message);
    }

    case 4: {
      // Guardar área descuidada → preguntar hora
      let profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
      if (!profile) {
        profile = await prisma.userProfile.create({
          data: { userId: user.id, neglectedArea: message.trim() },
        });
      } else {
        await prisma.userProfile.update({
          where: { userId: user.id },
          data: { neglectedArea: message.trim() },
        });
      }
      await advanceStep(user.id, 5);
      return `${NEGLECTED_RESPONSE}\n\n${TIME_QUESTION}`;
    }

    case 5: {
      // Guardar hora → cerrar onboarding
      const time = parseTime(message);
      await prisma.userProfile.update({
        where: { userId: user.id },
        data: { wakeUpTime: time },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: {
          onboardingStep: 6,
          onboardingCompletedAt: new Date(),
        },
      });
      const profile = await getProfile(user.id);
      return buildClosingMessage(profile.name, time);
    }

    default: {
      // onboarding completo — no debería llegar aquí
      const { chat } = await import('@axis/ai');
      return chat(user.id, message);
    }
  }
}

// ---------------------------------------------------------------------------
// Contexto del usuario post-onboarding (para inyectar en el system prompt)
// ---------------------------------------------------------------------------

export function buildUserContext(profile: UserProfile & { lifeAreas: LifeArea[] }): string {
  const areas = profile.lifeAreas
    .filter((a) => a.isActive)
    .map((a) => `- ${a.name}: ${a.goal90days ?? 'sin meta definida aún'}`)
    .join('\n');

  return `## Lo que sé de este usuario

Nombre: ${profile.name ?? 'desconocido'}

Áreas de vida activas y sus metas de 90 días:
${areas}

Área que admitió estar descuidando: ${profile.neglectedArea ?? 'no definida'}

Recibe su guía del día a las: ${profile.wakeUpTime}

## Cómo usar este contexto

- Cuando el usuario mencione trabajo, conecta con su meta de trabajo
- Si el usuario está saturado, prioriza basado en sus áreas y metas
- Si detectas que está ignorando su área descuidada, nómbralo con respeto
- Nunca preguntes cosas que ya sabes de este contexto`.trim();
}
