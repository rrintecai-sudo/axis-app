'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import type { Value as PhoneValue } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

const AXIS_PHONE = process.env.NEXT_PUBLIC_AXIS_PHONE ?? '';

const GREEN = '#22c55e';
const GREEN_DIM = 'rgba(34,197,94,0.12)';
const GREEN_BORDER = 'rgba(34,197,94,0.2)';

export default function OnboardingPage() {
  const router = useRouter();
  const [phone, setPhone] = useState<PhoneValue>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!phone || !isValidPhoneNumber(phone)) {
      setError('Ingresa un número de teléfono válido.');
      return;
    }

    const digits = phone.replace(/\D/g, '');

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
    <>
      <style>{`
        .PhoneInput {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #1a1a1a;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 0 0.9rem;
          transition: border-color 0.2s;
        }
        .PhoneInput:focus-within {
          border-color: ${GREEN};
        }
        .PhoneInputCountry {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.7rem 0 0.7rem 0;
          border-right: 1px solid rgba(255,255,255,0.08);
          padding-right: 0.7rem;
        }
        .PhoneInputCountrySelect {
          background: transparent;
          border: none;
          color: #f5f5f5;
          font-size: 0.85rem;
          outline: none;
          cursor: pointer;
          appearance: none;
          width: 18px;
          opacity: 0;
          position: absolute;
        }
        .PhoneInputCountrySelectArrow {
          color: #71717a;
          font-size: 0.6rem;
        }
        .PhoneInputInput {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #f5f5f5;
          font-size: 0.9rem;
          padding: 0.7rem 0;
        }
        .PhoneInputInput::placeholder {
          color: #3f3f3f;
        }
        .PhoneInputCountryIcon {
          width: 20px;
          height: 14px;
        }
        .PhoneInputCountryIcon--square {
          width: 14px;
        }
      `}</style>

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
        {/* Logo + steps */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            letterSpacing: '0.2em',
            color: GREEN,
            marginBottom: '1rem',
          }}>
            AXIS
          </div>
          {!done && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
              <Step n={1} label="Cuenta" done />
              <div style={{ width: 24, height: 1, background: '#2a2a2a' }} />
              <Step n={2} label="WhatsApp" active />
            </div>
          )}
        </div>

        {/* Card */}
        <div style={{
          width: '100%',
          maxWidth: 420,
          background: '#111',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16,
          padding: '2rem',
        }}>
          {done ? (
            <SuccessState phone={phone ?? ''} axisPhone={AXIS_PHONE} onDashboard={() => router.push('/dashboard')} />
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
    </>
  );
}

function Step({ n, label, done, active }: { n: number; label: string; done?: boolean; active?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700,
        background: done ? GREEN : active ? GREEN_DIM : 'transparent',
        color: done ? '#000' : active ? GREEN : '#555',
        border: done ? 'none' : active ? `1px solid ${GREEN}` : '1px solid #333',
      }}>
        {done ? '✓' : n}
      </div>
      <span style={{ fontSize: 12, color: done ? GREEN : active ? GREEN : '#555', fontWeight: done || active ? 600 : 400 }}>
        {label}
      </span>
    </div>
  );
}

function FormState({
  phone, setPhone, isLoading, error, onSubmit,
}: {
  phone: PhoneValue;
  setPhone: (v: PhoneValue) => void;
  isLoading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const canSubmit = !!phone && isValidPhoneNumber(phone ?? '');

  return (
    <form onSubmit={(e) => void onSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f5f5f5', marginBottom: '0.5rem' }}>
          ¿Cuál es tu WhatsApp?
        </h1>
        <p style={{ fontSize: '0.82rem', color: '#71717a', lineHeight: 1.65 }}>
          AXIS te acompaña por WhatsApp. Necesitamos tu número para reconocerte cuando escribas.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Tu número de WhatsApp
        </label>
        <PhoneInput
          defaultCountry="VE"
          value={phone}
          onChange={setPhone}
          placeholder="0412 123 4567"
          international
          countryCallingCodeEditable={false}
        />
        {error != null && (
          <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.2rem' }}>{error}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || !canSubmit}
        style={{
          width: '100%',
          padding: '0.8rem',
          background: canSubmit && !isLoading ? GREEN : 'rgba(34,197,94,0.25)',
          color: canSubmit && !isLoading ? '#000' : 'rgba(255,255,255,0.3)',
          border: 'none',
          borderRadius: 8,
          fontSize: '0.9rem',
          fontWeight: 700,
          cursor: canSubmit && !isLoading ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s',
        }}
      >
        {isLoading ? 'Guardando...' : 'Guardar y continuar →'}
      </button>
    </form>
  );
}

function SuccessState({ phone, axisPhone, onDashboard }: { phone: string; axisPhone: string; onDashboard: () => void }) {
  const waLink = axisPhone ? `https://wa.me/${axisPhone}?text=Hola%20AXIS` : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center' }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: GREEN_DIM,
        border: `1px solid ${GREEN_BORDER}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto',
        fontSize: '1.5rem',
        color: GREEN,
      }}>
        ✓
      </div>

      <div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f5f5f5', marginBottom: '0.4rem' }}>
          ¡Número guardado!
        </h2>
        <p style={{ fontSize: '0.82rem', color: '#71717a', lineHeight: 1.65 }}>
          Ahora escríbele a AXIS por WhatsApp.<br />
          Él empezará a conocerte en esa conversación.
        </p>
      </div>

      <div style={{
        background: GREEN_DIM,
        border: `1px solid ${GREEN_BORDER}`,
        borderRadius: 10,
        padding: '1rem',
        textAlign: 'left',
      }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 700, color: GREEN, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Siguiente paso
        </p>
        <p style={{ fontSize: '0.8rem', color: '#a3a3a3', lineHeight: 1.65 }}>
          Escríbele cualquier cosa — "hola", lo que sea. AXIS iniciará el onboarding contigo directamente por WhatsApp.
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
              padding: '0.8rem',
              background: GREEN,
              color: '#000',
              borderRadius: 8,
              fontSize: '0.9rem',
              fontWeight: 700,
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
            color: '#555',
            border: '1px solid #222',
            borderRadius: 8,
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          Ir al dashboard
        </button>
      </div>
    </div>
  );
}
