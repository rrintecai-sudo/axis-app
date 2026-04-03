'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const AXIS_PHONE = process.env.NEXT_PUBLIC_AXIS_PHONE ?? '';

export default function OnboardingPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Ingresa un número válido con código de país (ej: 18091234567)');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/user/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits }),
      });

      if (!res.ok) {
        const body = await res.json() as { error?: string };
        setError(body.error ?? 'Ocurrió un error. Intenta de nuevo.');
        return;
      }

      setDone(true);
    } catch {
      setError('No se pudo conectar. Verifica tu conexión.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080808',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <div style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          letterSpacing: '0.2em',
          color: '#818cf8',
          marginBottom: '0.5rem',
        }}>
          AXIS
        </div>
        {!done && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
            <Step n={1} label="Cuenta" done />
            <div style={{ width: 24, height: 1, background: '#333' }} />
            <Step n={2} label="WhatsApp" active />
          </div>
        )}
      </div>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: '#111',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: '2rem',
      }}>
        {done ? (
          <SuccessState phone={phone} axisPhone={AXIS_PHONE} onDashboard={() => router.push('/dashboard')} />
        ) : (
          <FormState
            phone={phone}
            setPhone={setPhone}
            isLoading={isLoading}
            error={error}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}

function Step({ n, label, done, active }: { n: number; label: string; done?: boolean; active?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 600,
        background: done ? '#6366f1' : active ? 'rgba(99,102,241,0.15)' : 'transparent',
        color: done ? 'white' : active ? '#818cf8' : '#555',
        border: done ? 'none' : active ? '1px solid #6366f1' : '1px solid #333',
      }}>
        {done ? '✓' : n}
      </div>
      <span style={{ fontSize: 11, color: done ? '#a5b4fc' : active ? '#818cf8' : '#555' }}>{label}</span>
    </div>
  );
}

function FormState({
  phone, setPhone, isLoading, error, onSubmit,
}: {
  phone: string;
  setPhone: (v: string) => void;
  isLoading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={(e) => void onSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#f5f5f5', marginBottom: '0.4rem' }}>
          ¿Cuál es tu WhatsApp?
        </h1>
        <p style={{ fontSize: '0.8rem', color: '#71717a', lineHeight: 1.6 }}>
          AXIS te acompaña principalmente por WhatsApp. Necesitamos tu número para reconocerte cuando escribas.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <label style={{ fontSize: '0.7rem', fontWeight: 500, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Número con código de país
        </label>
        <input
          type="tel"
          placeholder="18091234567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{
            width: '100%',
            padding: '0.7rem 0.9rem',
            background: '#1a1a1a',
            border: error ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            color: '#f5f5f5',
            fontSize: '0.9rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {error != null && (
          <p style={{ fontSize: '0.75rem', color: '#f87171' }}>{error}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || phone.trim() === ''}
        style={{
          width: '100%',
          padding: '0.75rem',
          background: isLoading || phone.trim() === '' ? 'rgba(99,102,241,0.4)' : '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: isLoading || phone.trim() === '' ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
        }}
      >
        {isLoading ? 'Guardando...' : 'Guardar y continuar →'}
      </button>
    </form>
  );
}

function SuccessState({ phone, axisPhone, onDashboard }: { phone: string; axisPhone: string; onDashboard: () => void }) {
  const digits = phone.replace(/\D/g, '');
  const waLink = axisPhone ? `https://wa.me/${axisPhone}?text=Hola%20AXIS` : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center' }}>
      {/* Check */}
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: 'rgba(34,197,94,0.12)',
        border: '1px solid rgba(34,197,94,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto',
        fontSize: '1.4rem',
      }}>
        ✓
      </div>

      <div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f5f5f5', marginBottom: '0.4rem' }}>
          ¡Número guardado!
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#71717a', lineHeight: 1.6 }}>
          Registramos <span style={{ color: '#a5b4fc' }}>+{digits}</span>.<br />
          Ahora escríbele a AXIS por WhatsApp para que empiece a conocerte.
        </p>
      </div>

      <div style={{
        background: 'rgba(34,197,94,0.05)',
        border: '1px solid rgba(34,197,94,0.15)',
        borderRadius: 10,
        padding: '1rem',
        textAlign: 'left',
      }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#4ade80', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Siguiente paso
        </p>
        <p style={{ fontSize: '0.78rem', color: '#71717a', lineHeight: 1.6 }}>
          Escríbele cualquier mensaje a AXIS por WhatsApp. Él iniciará una conversación para conocerte — tus metas, tus áreas de vida, tu ritmo del día.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              padding: '0.75rem',
              background: '#16a34a',
              color: 'white',
              borderRadius: 8,
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
              textAlign: 'center',
            }}
          >
            Escribirle a AXIS por WhatsApp →
          </a>
        )}
        <button
          onClick={onDashboard}
          style={{
            width: '100%',
            padding: '0.65rem',
            background: 'transparent',
            color: '#71717a',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          Ir al dashboard →
        </button>
      </div>
    </div>
  );
}
