import { getAxisUser } from '@/lib/auth';
import { getTodaysBrief, getTodaysTasks } from '@/lib/api';
import BriefCard from '@/components/BriefCard';
import TaskCard from '@/components/TaskCard';
import OnboardingBanner from '@/components/OnboardingBanner';

function todayLabel(): string {
  return new Date().toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function greet(name?: string | null): string {
  const h = new Date().getHours();
  const prefix = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  return name?.trim() ? `${prefix}, ${name.split(' ')[0]}.` : `${prefix}.`;
}

const EmptyCard = ({ title, hint }: { title: string; hint: string }) => (
  <div
    className="rounded-2xl p-6 flex flex-col items-center justify-center gap-3 min-h-[160px] text-center"
    style={{ background: 'rgba(34,197,94,0.03)', border: '1px dashed rgba(34,197,94,0.15)' }}
  >
    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
      <svg width="18" height="18" fill="none" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    </div>
    <div>
      <p className="text-sm font-medium" style={{ color: 'rgba(240,253,244,0.6)' }}>{title}</p>
      <p className="text-xs mt-1" style={{ color: 'rgba(134,239,172,0.35)' }}>{hint}</p>
    </div>
  </div>
);

export default async function DashboardPage() {
  const user = await getAxisUser();
  const [brief, tasks] = await Promise.all([getTodaysBrief(user.id), getTodaysTasks(user.id)]);
  const onboardingComplete = user.onboardingStep >= 6;

  return (
    <div className="flex flex-col gap-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-1 pt-2">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#f0fdf4' }}>{greet(user.name)}</h1>
            <p className="text-xs capitalize mt-0.5" style={{ color: 'rgba(134,239,172,0.45)', letterSpacing: '0.04em' }}>{todayLabel()}</p>
          </div>
          <div
            className="ml-auto px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}
          >
            Trial activo
          </div>
        </div>

        {/* Divider with glow */}
        <div className="mt-4 h-px" style={{ background: 'linear-gradient(90deg, rgba(34,197,94,0.3), rgba(34,197,94,0.05) 60%, transparent)' }} />
      </div>

      {/* ── Onboarding banner ── */}
      {!onboardingComplete && <OnboardingBanner />}

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tareas hoy', value: tasks.length, unit: 'pendientes' },
          { label: 'Completadas', value: tasks.filter(t => t.status === 'DONE').length, unit: 'hoy' },
          { label: 'Brief', value: brief ? '✓' : '—', unit: brief ? 'disponible' : 'sin datos' },
        ].map(stat => (
          <div
            key={stat.label}
            className="rounded-2xl p-4 flex flex-col gap-1"
            style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)' }}
          >
            <p className="text-xs font-medium" style={{ color: 'rgba(134,239,172,0.5)' }}>{stat.label}</p>
            <p className="text-2xl font-bold" style={{ color: '#4ade80' }}>{stat.value}</p>
            <p className="text-[10px]" style={{ color: 'rgba(134,239,172,0.35)' }}>{stat.unit}</p>
          </div>
        ))}
      </div>

      {/* ── Two columns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brief del día */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            <h2 className="text-xs font-bold tracking-[0.15em] uppercase" style={{ color: 'rgba(34,197,94,0.7)' }}>Brief del día</h2>
          </div>
          {brief ? (
            <BriefCard brief={brief} compact />
          ) : (
            <EmptyCard title="Sin brief para hoy" hint="AXIS lo preparará vía WhatsApp esta mañana." />
          )}
        </section>

        {/* Tareas */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            <h2 className="text-xs font-bold tracking-[0.15em] uppercase" style={{ color: 'rgba(34,197,94,0.7)' }}>Tareas de hoy</h2>
          </div>
          {tasks.length > 0 ? (
            <div className="flex flex-col gap-2">
              {tasks.map(task => <TaskCard key={task.id} task={task} />)}
            </div>
          ) : (
            <EmptyCard title="Sin tareas para hoy" hint="Dile a AXIS por WhatsApp qué quieres lograr." />
          )}
        </section>
      </div>
    </div>
  );
}
