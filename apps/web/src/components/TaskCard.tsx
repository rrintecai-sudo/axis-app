'use client';

import { Task, TaskStatus } from '@/lib/api';

interface TaskCardProps {
  task: Task;
  onStatusChange?: (id: string, status: TaskStatus) => void;
}

function priorityStyle(p: number): { bg: string; color: string; border: string; label: string } {
  if (p >= 8) return { bg: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'rgba(239,68,68,0.25)', label: 'Alta' };
  if (p >= 5) return { bg: 'rgba(234,179,8,0.1)', color: '#facc15', border: 'rgba(234,179,8,0.25)', label: 'Media' };
  return { bg: 'rgba(34,197,94,0.08)', color: '#4ade80', border: 'rgba(34,197,94,0.2)', label: 'Normal' };
}

function statusStyle(s: TaskStatus): { bg: string; color: string; border: string; label: string } {
  switch (s) {
    case 'PENDING':    return { bg: 'rgba(113,113,122,0.12)', color: '#a1a1aa', border: 'rgba(113,113,122,0.25)', label: 'Pendiente' };
    case 'IN_PROGRESS':return { bg: 'rgba(34,197,94,0.1)',   color: '#4ade80', border: 'rgba(34,197,94,0.25)',   label: 'En progreso' };
    case 'DONE':       return { bg: 'rgba(34,197,94,0.08)',  color: '#22c55e', border: 'rgba(34,197,94,0.2)',    label: 'Completado' };
  }
}

export default function TaskCard({ task, onStatusChange }: TaskCardProps) {
  const pri = priorityStyle(task.priority);
  const sta = statusStyle(task.status);
  const done = task.status === 'DONE';

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3 transition-all"
      style={{
        background: done ? 'rgba(6,15,9,0.6)' : 'linear-gradient(135deg,#0a1a0f,#071410)',
        border: `1px solid ${task.isTopTask ? 'rgba(34,197,94,0.35)' : 'rgba(34,197,94,0.12)'}`,
        opacity: done ? 0.55 : 1,
        boxShadow: task.isTopTask ? '0 0 0 1px rgba(34,197,94,0.1), inset 0 1px 0 rgba(34,197,94,0.08)' : 'none',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={`text-sm font-medium leading-snug flex-1 ${done ? 'line-through' : ''}`}
          style={{ color: done ? 'rgba(240,253,244,0.35)' : '#f0fdf4' }}>
          {task.title}
        </p>
        {task.isTopTask && (
          <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap"
            style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
            ★ TOP
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg"
          style={{ background: pri.bg, color: pri.color, border: `1px solid ${pri.border}` }}>
          {pri.label}
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded-lg"
          style={{ background: 'rgba(34,197,94,0.06)', color: 'rgba(134,239,172,0.6)', border: '1px solid rgba(34,197,94,0.12)' }}>
          {task.lifeArea}
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded-lg"
          style={{ background: sta.bg, color: sta.color, border: `1px solid ${sta.border}` }}>
          {sta.label}
        </span>
      </div>

      {task.aiReason && (
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(134,239,172,0.4)' }}>{task.aiReason}</p>
      )}

      {onStatusChange && !done && (
        <button
          onClick={() => onStatusChange(task.id, 'DONE')}
          className="self-end text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
          style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          Marcar como hecho ✓
        </button>
      )}
    </div>
  );
}
