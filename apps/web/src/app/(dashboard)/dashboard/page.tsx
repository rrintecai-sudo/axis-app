import { getAxisUser } from '@/lib/auth';
import { getTodaysBrief, getTodaysTasks } from '@/lib/api';
import BriefCard from '@/components/BriefCard';
import TaskCard from '@/components/TaskCard';
import OnboardingBanner from '@/components/OnboardingBanner';

function greet(name?: string | null): string {
  const h = new Date().getHours();
  const prefix = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  return name?.trim() ? `${prefix}, ${name.split(' ')[0]}` : prefix;
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
    <span style={{
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: '#22c55e',
      boxShadow: '0 0 6px #22c55e',
      flexShrink: 0,
      display: 'inline-block',
    }} />
    <h2 style={{
      margin: 0,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
      color: 'rgba(34,197,94,0.7)',
    }}>{children}</h2>
  </div>
);

const EmptyCard = ({ text }: { text: string }) => (
  <div style={{
    background: '#141417',
    border: '1px dashed rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '32px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  }}>
    <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>{text}</p>
  </div>
);

export default async function DashboardPage() {
  const user = await getAxisUser();
  const [brief, tasks] = await Promise.all([getTodaysBrief(user.id), getTodaysTasks(user.id)]);
  const onboardingComplete = user.onboardingStep >= 6;

  const pendingCount = tasks.filter(t => t.status !== 'DONE').length;
  const doneCount = tasks.filter(t => t.status === 'DONE').length;
  const briefStatus = brief ? 'Listo' : 'Pendiente';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Onboarding Banner */}
      {!onboardingComplete && <OnboardingBanner />}

      {/* HERO CARD */}
      <div style={{
        background: 'linear-gradient(135deg, #0f2a1a 0%, #0a1a10 100%)',
        border: '1px solid rgba(34,197,94,0.2)',
        borderRadius: 16,
        padding: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
      }}>
        {/* Left side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#f0fdf4' }}>
            {greet(user.name)} 👋
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(240,253,244,0.55)' }}>
            Tu guía de hoy está lista en WhatsApp.
          </p>
          {user.phone && (
            <a
              href={`https://wa.me/${user.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 6,
                padding: '9px 18px',
                borderRadius: 8,
                background: '#22c55e',
                color: '#000',
                fontWeight: 700,
                fontSize: 13.5,
                textDecoration: 'none',
                alignSelf: 'flex-start',
              }}
            >
              Abrir WhatsApp →
            </a>
          )}
          {!user.phone && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 6,
              padding: '9px 18px',
              borderRadius: 8,
              background: '#22c55e',
              color: '#000',
              fontWeight: 700,
              fontSize: 13.5,
              opacity: 0.5,
              cursor: 'not-allowed',
              alignSelf: 'flex-start',
            }}>
              Abrir WhatsApp →
            </div>
          )}
        </div>

        {/* Right side: task count */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          flexShrink: 0,
          background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.15)',
          borderRadius: 12,
          padding: '16px 24px',
        }}>
          <span style={{ fontSize: 42, fontWeight: 800, color: '#22c55e', lineHeight: 1 }}>
            {tasks.length}
          </span>
          <span style={{ fontSize: 12, color: 'rgba(34,197,94,0.6)', fontWeight: 500 }}>
            tareas hoy
          </span>
        </div>
      </div>

      {/* STATS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {[
          { label: 'Tareas pendientes', value: pendingCount },
          { label: 'Completadas hoy', value: doneCount },
          { label: 'Brief', value: briefStatus },
        ].map(stat => (
          <div key={stat.label} style={{
            background: '#141417',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
              {stat.label}
            </p>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#4ade80' }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* TWO COLUMNS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Brief del día */}
        <section>
          <SectionTitle>Brief del día</SectionTitle>
          {brief ? (
            <BriefCard brief={brief} compact />
          ) : (
            <EmptyCard text="Sin brief disponible — AXIS lo preparará esta mañana vía WhatsApp." />
          )}
        </section>

        {/* Tareas de hoy */}
        <section>
          <SectionTitle>Tareas de hoy</SectionTitle>
          {tasks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tasks.map(task => <TaskCard key={task.id} task={task} />)}
            </div>
          ) : (
            <EmptyCard text="Sin tareas para hoy — dile a AXIS por WhatsApp qué quieres lograr." />
          )}
        </section>

      </div>
    </div>
  );
}
