import { getAxisUser } from '@/lib/auth';
import { getUserTasks } from '@/lib/api';
import TasksClient from './TasksClient';

export default async function TasksPage() {
  const user = await getAxisUser();
  const tasks = await getUserTasks(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-[#F5F5F5]">Tareas</h1>
        <p className="text-sm text-[#71717A]">
          Todas tus tareas activas y completadas.
        </p>
      </div>

      <TasksClient initialTasks={tasks} />
    </div>
  );
}
