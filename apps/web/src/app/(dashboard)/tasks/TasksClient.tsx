'use client';

import { useState, useMemo } from 'react';
import { Task, TaskStatus, updateTask } from '@/lib/api';
import TaskCard from '@/components/TaskCard';

const STATUS_OPTIONS: { label: string; value: TaskStatus | '' }[] = [
  { label: 'Todas', value: '' },
  { label: 'Pendiente', value: 'PENDING' },
  { label: 'En progreso', value: 'IN_PROGRESS' },
  { label: 'Hecho', value: 'DONE' },
];

interface TasksClientProps {
  initialTasks: Task[];
}

// Collect unique life areas from tasks
function getLifeAreas(tasks: Task[]): string[] {
  const areas = new Set<string>();
  for (const task of tasks) {
    areas.add(task.lifeArea);
  }
  return Array.from(areas).sort();
}

export default function TasksClient({ initialTasks }: TasksClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [areaFilter, setAreaFilter] = useState<string>('');

  const lifeAreas = useMemo(() => getLifeAreas(tasks), [tasks]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const matchStatus = statusFilter === '' || t.status === statusFilter;
      const matchArea = areaFilter === '' || t.lifeArea === areaFilter;
      return matchStatus && matchArea;
    });
  }, [tasks, statusFilter, areaFilter]);

  async function handleStatusChange(id: string, status: TaskStatus) {
    try {
      const updated = await updateTask(id, { status });
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? updated : t)),
      );
    } catch (err) {
      console.error('Error updating task:', err);
    }
  }

  // Stats
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'DONE').length;
  const pending = tasks.filter((t) => t.status === 'PENDING').length;

  return (
    <div className="flex flex-col gap-6">
      {/* Stats bar */}
      <div className="flex gap-4">
        {[
          { label: 'Total', value: total },
          { label: 'Pendientes', value: pending },
          {
            label: 'Completadas',
            value: done,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-0.5 rounded-lg bg-[#111111] border border-[#1F1F1F] px-4 py-3"
          >
            <span className="text-xs text-[#71717A]">{stat.label}</span>
            <span className="text-lg font-semibold text-[#F5F5F5]">
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Status filter */}
        <div className="flex gap-1 p-1 rounded-lg bg-[#111111] border border-[#1F1F1F]">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={[
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                statusFilter === opt.value
                  ? 'bg-indigo-500/20 text-indigo-300'
                  : 'text-[#71717A] hover:text-[#F5F5F5]',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Life area filter */}
        {lifeAreas.length > 0 && (
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#111111] border border-[#1F1F1F] text-xs text-[#F5F5F5] outline-none focus:border-indigo-500/50"
          >
            <option value="">Todas las áreas</option>
            {lifeAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Task list */}
      {filtered.length > 0 ? (
        <div className="flex flex-col gap-2">
          {filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={(id, status) =>
                void handleStatusChange(id, status)
              }
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg bg-[#111111] border border-[#1F1F1F] p-10 flex items-center justify-center">
          <p className="text-sm text-[#71717A]">
            {tasks.length === 0
              ? 'No tienes tareas aún. Dile a AXIS por WhatsApp.'
              : 'No hay tareas que coincidan con los filtros seleccionados.'}
          </p>
        </div>
      )}
    </div>
  );
}
