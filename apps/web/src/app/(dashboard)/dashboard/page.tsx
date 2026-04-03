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
  <h2 style={{
    margin: '0 0 14px',
    fontSize: 17,
    fontWeight: 700,
    color: '#f0fdf4',
    letterSpacing: '-0.01em',
  }}>{children}</h2>
);

const EmptyCard = ({ text }: { text: string }) => (
  <div style={{
    background: 'rgba(255,255,255,0.03)',
    border: '1px dashed rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: '32px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  }}>
    <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 1.5 }}>{text}</p>
  </div>
);

export default async function DashboardPage() {
  const user = await getAxisUser();
  const [brief, tasks] = await Promise.all([getTodaysBrief(user.id), getTodaysTasks(user.id)]);
  const pendingCount = tasks.filter(t => t.status !== 'DONE').length;
  const doneCount = tasks.filter(t => t.status === 'DONE').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {!user.phone && <OnboardingBanner />}

      {/* ── HERO BANNER (full width) ── */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 20,
        padding: '36px 40px',
        background: 'linear-gradient(135deg, #052e12 0%, #0a1f0f 50%, #071a0d 100%)',
        border: '1px solid rgba(34,197,94,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
        minHeight: 180,
      }}>
        {/* Decorative glow blobs */}
        <div style={{
          position: 'absolute', top: -60, right: 120,
          width: 220, height: 220, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,197,94,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -40, right: 60,
          width: 160, height: 160, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Left: greeting + CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, zIndex: 1 }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(74,222,128,0.6)' }}>
              Tu asistente personal
            </p>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#f0fdf4', lineHeight: 1.2 }}>
              {greet(user.name)} 👋
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(240,253,244,0.5)', maxWidth: 340, lineHeight: 1.5 }}>
            Tu guía de hoy está lista. AXIS te acompaña en WhatsApp para que no pierdas el foco.
          </p>
          {user.phone ? (
            <a
              href={`https://wa.me/${user.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 4,
                padding: '10px 22px',
                borderRadius: 50,
                background: '#22c55e',
                color: '#000',
                fontWeight: 700,
                fontSize: 13.5,
                textDecoration: 'none',
                alignSelf: 'flex-start',
                letterSpacing: '0.01em',
              }}
            >
              Abrir WhatsApp →
            </a>
          ) : (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 4,
              padding: '10px 22px',
              borderRadius: 50,
              background: 'rgba(34,197,94,0.2)',
              color: 'rgba(74,222,128,0.5)',
              fontWeight: 700,
              fontSize: 13.5,
              alignSelf: 'flex-start',
              cursor: 'not-allowed',
            }}>
              Conecta tu WhatsApp
            </span>
          )}
        </div>

        {/* Right: big stat */}
        <div style={{
          zIndex: 1,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.18)',
          borderRadius: 16,
          padding: '20px 32px',
        }}>
          <span style={{ fontSize: 52, fontWeight: 900, color: '#22c55e', lineHeight: 1 }}>
            {tasks.length}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(74,222,128,0.55)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            tareas hoy
          </span>
        </div>
      </div>

      {/* ── CONTENT: main (left) + right panel ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20, alignItems: 'start' }}>

        {/* ── LEFT: main content ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

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

        {/* ── RIGHT PANEL: widgets ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Stat: Pendientes */}
          <div style={{
            background: '#0d1f12',
            border: '1px solid rgba(34,197,94,0.12)',
            borderRadius: 16,
            padding: '20px 22px',
          }}>
            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
              Pendientes
            </p>
            <p style={{ margin: 0, fontSize: 36, fontWeight: 900, color: '#4ade80', lineHeight: 1 }}>
              {pendingCount}
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
              tareas por completar
            </p>
          </div>

          {/* Stat: Completadas */}
          <div style={{
            background: '#0d1f12',
            border: '1px solid rgba(34,197,94,0.12)',
            borderRadius: 16,
            padding: '20px 22px',
          }}>
            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
              Completadas hoy
            </p>
            <p style={{ margin: 0, fontSize: 36, fontWeight: 900, color: '#22c55e', lineHeight: 1 }}>
              {doneCount}
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
              tareas finalizadas
            </p>
          </div>

          {/* Stat: Brief */}
          <div style={{
            background: '#0d1f12',
            border: '1px solid rgba(34,197,94,0.12)',
            borderRadius: 16,
            padding: '20px 22px',
          }}>
            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
              Brief de hoy
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: brief ? '#22c55e' : 'rgba(255,255,255,0.2)',
                boxShadow: brief ? '0 0 6px #22c55e' : 'none',
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: brief ? '#4ade80' : 'rgba(255,255,255,0.35)' }}>
                {brief ? 'Listo' : 'Pendiente'}
              </span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.25)', lineHeight: 1.4 }}>
              {brief ? 'Tu guía del día está disponible.' : 'AXIS lo enviará por WhatsApp.'}
            </p>
          </div>

          {/* Quick tip */}
          <div style={{
            background: 'linear-gradient(135deg, #052e12, #071a0d)',
            border: '1px solid rgba(34,197,94,0.15)',
            borderRadius: 16,
            padding: '18px 22px',
          }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(74,222,128,0.5)' }}>
              Recuerda
            </p>
            <p style={{ margin: 0, fontSize: 12.5, color: 'rgba(240,253,244,0.45)', lineHeight: 1.55 }}>
              Escríbele a AXIS en cualquier momento para actualizar tus tareas, pedir consejo o registrar un logro.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
