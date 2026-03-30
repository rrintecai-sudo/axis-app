import type {
  UserProfile,
  LifeArea,
  Task,
  Memory,
  TaskStatus,
} from '@axis/db';

export function buildUserProfileContext(
  profile: UserProfile & { lifeAreas: LifeArea[] },
): string {
  const lines: string[] = [];

  if (profile.roles.length > 0) {
    lines.push(`Roles: ${profile.roles.join(', ')}`);
  }

  if (profile.values.length > 0) {
    lines.push(`Valores: ${profile.values.join(', ')}`);
  }

  if (profile.topPriority) {
    lines.push(`Prioridad principal: ${profile.topPriority}`);
  }

  lines.push(`Horario: despierta a las ${profile.wakeUpTime}, duerme a las ${profile.sleepTime}`);

  const activeAreas = profile.lifeAreas
    .filter((a) => a.isActive)
    .sort((a, b) => a.priority - b.priority);

  if (activeAreas.length > 0) {
    lines.push(`Áreas de vida activas: ${activeAreas.map((a) => a.name).join(', ')}`);
  }

  return lines.join('\n');
}

export function buildTasksContext(tasks: Task[]): string {
  if (tasks.length === 0) {
    return 'No hay tareas registradas.';
  }

  const statusLabel: Record<TaskStatus, string> = {
    PENDING: 'Pendiente',
    IN_PROGRESS: 'En progreso',
    DONE: 'Completada',
    SKIPPED: 'Saltada',
  };

  return tasks
    .map((t) => {
      const parts: string[] = [];
      parts.push(`- ${t.title}`);
      if (t.description) parts.push(`  Descripción: ${t.description}`);
      if (t.lifeArea) parts.push(`  Área: ${t.lifeArea}`);
      parts.push(`  Prioridad: ${t.priority}/10 | Impacto: ${t.impact}/10`);
      parts.push(`  Estado: ${statusLabel[t.status]}`);
      if (t.dueDate) {
        parts.push(`  Fecha límite: ${t.dueDate.toISOString().split('T')[0]}`);
      }
      if (t.aiReason) parts.push(`  Razón IA: ${t.aiReason}`);
      if (t.isTopTask) parts.push(`  ★ Tarea principal del día`);
      return parts.join('\n');
    })
    .join('\n\n');
}

export function buildConversationContext(
  messages: { role: string; content: string }[],
): string {
  if (messages.length === 0) {
    return 'No hay mensajes previos en esta conversación.';
  }

  return messages
    .map((m) => {
      const label = m.role === 'USER' || m.role === 'user' ? 'Usuario' : 'AXIS';
      return `${label}: ${m.content}`;
    })
    .join('\n');
}

export function buildMemoriesContext(memories: Memory[]): string {
  if (memories.length === 0) {
    return 'No hay memorias relevantes almacenadas.';
  }

  return memories
    .map((mem) => `[${mem.category}] ${mem.content}`)
    .join('\n');
}
