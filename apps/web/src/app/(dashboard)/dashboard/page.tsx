import { getAxisUser } from '@/lib/auth';
import { getTodaysBrief, getTodaysTasks } from '@/lib/api';
import BriefCard from '@/components/BriefCard';
import TaskCard from '@/components/TaskCard';
import OnboardingBanner from '@/components/OnboardingBanner';

function todayLabel(): string {
  return new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function greet(name?: string | null): string {
  const hour = new Date().getHours();
  const prefix =
    hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  return name != null && name.trim() !== ''
    ? `${prefix}, ${name.split(' ')[0]}.`
    : `${prefix}.`;
}

export default async function DashboardPage() {
  const user = await getAxisUser();

  const [brief, tasks] = await Promise.all([
    getTodaysBrief(user.id),
    getTodaysTasks(user.id),
  ]);

  const onboardingComplete = user.onboardingStep >= 6;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-[#F5F5F5]">
          {greet(user.name)}
        </h1>
        <p className="text-sm text-[#71717A] capitalize">{todayLabel()}</p>
      </div>

      {/* Onboarding banner */}
      {!onboardingComplete && <OnboardingBanner />}

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brief del día */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-[#71717A] uppercase tracking-widest">
            Brief del día
          </h2>
          {brief != null ? (
            <BriefCard brief={brief} compact />
          ) : (
            <div className="rounded-lg bg-[#111111] border border-[#1F1F1F] p-5 flex items-center justify-center min-h-[140px]">
              <p className="text-sm text-[#71717A] text-center">
                No hay brief disponible para hoy.
                <br />
                <span className="text-xs">AXIS lo preparará vía WhatsApp.</span>
              </p>
            </div>
          )}
        </section>

        {/* Tareas de hoy */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-[#71717A] uppercase tracking-widest">
            Tareas de hoy
          </h2>
          {tasks.length > 0 ? (
            <div className="flex flex-col gap-2">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-[#111111] border border-[#1F1F1F] p-5 flex items-center justify-center min-h-[140px]">
              <p className="text-sm text-[#71717A] text-center">
                Sin tareas para hoy.
                <br />
                <span className="text-xs">
                  Dile a AXIS por WhatsApp qué quieres lograr.
                </span>
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
