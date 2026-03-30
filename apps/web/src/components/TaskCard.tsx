'use client';

import { Task, TaskStatus } from '@/lib/api';

interface TaskCardProps {
  task: Task;
  onStatusChange?: (id: string, status: TaskStatus) => void;
}

function priorityBadge(priority: number): {
  label: string;
  className: string;
} {
  if (priority >= 8) {
    return {
      label: `P${priority}`,
      className:
        'bg-red-500/15 text-red-400 border border-red-500/20',
    };
  }
  if (priority >= 5) {
    return {
      label: `P${priority}`,
      className:
        'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
    };
  }
  return {
    label: `P${priority}`,
    className:
      'bg-zinc-700/40 text-zinc-400 border border-zinc-700/40',
  };
}

function statusLabel(status: TaskStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Pendiente';
    case 'IN_PROGRESS':
      return 'En progreso';
    case 'DONE':
      return 'Hecho';
  }
}

function statusClass(status: TaskStatus): string {
  switch (status) {
    case 'PENDING':
      return 'bg-zinc-700/40 text-zinc-400 border border-zinc-700/40';
    case 'IN_PROGRESS':
      return 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20';
    case 'DONE':
      return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20';
  }
}

export default function TaskCard({ task, onStatusChange }: TaskCardProps) {
  const badge = priorityBadge(task.priority);
  const isDone = task.status === 'DONE';

  return (
    <div
      className={[
        'relative rounded-lg bg-[#111111] border border-[#1F1F1F] p-4 transition-opacity',
        task.isTopTask ? 'border-l-2 border-l-indigo-500' : '',
        isDone ? 'opacity-60' : '',
      ].join(' ')}
    >
      {task.isTopTask && (
        <span className="absolute top-3 right-3 text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded px-2 py-0.5">
          Top tarea
        </span>
      )}

      <div className="flex flex-col gap-2">
        {/* Title */}
        <p
          className={[
            'text-sm font-medium text-[#F5F5F5] leading-snug pr-20',
            isDone ? 'line-through text-[#71717A]' : '',
          ].join(' ')}
        >
          {task.title}
        </p>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-xs font-medium rounded px-2 py-0.5 ${badge.className}`}
          >
            {badge.label}
          </span>

          <span className="text-xs rounded px-2 py-0.5 bg-zinc-800/60 text-zinc-400 border border-zinc-700/40">
            {task.lifeArea}
          </span>

          <span
            className={`text-xs rounded px-2 py-0.5 ${statusClass(task.status)}`}
          >
            {statusLabel(task.status)}
          </span>
        </div>

        {/* AI Reason */}
        {task.aiReason != null && task.aiReason !== '' && (
          <p className="text-xs text-[#71717A] leading-relaxed mt-1">
            {task.aiReason}
          </p>
        )}

        {/* Action button */}
        {onStatusChange != null && task.status !== 'DONE' && (
          <div className="flex justify-end mt-1">
            <button
              onClick={() => onStatusChange(task.id, 'DONE')}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Marcar como hecho ✓
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
