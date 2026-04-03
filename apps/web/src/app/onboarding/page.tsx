'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      router.push('/dashboard');
    } catch {
      setError('No se pudo conectar. Verifica tu conexión.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-5xl font-bold text-indigo-400 tracking-tight">AXIS</span>
          <p className="text-sm text-[#71717A] text-center">Un último paso para activar tu cuenta.</p>
        </div>

        {/* Card */}
        <div className="w-full rounded-xl bg-[#111111] border border-[#1F1F1F] p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold text-[#F5F5F5]">
              ¿Cuál es tu WhatsApp?
            </h1>
            <p className="text-sm text-[#71717A]">
              AXIS te acompaña principalmente por WhatsApp. Necesitamos tu número para activar la conexión.
            </p>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="text-xs font-medium text-[#71717A]">
                Número con código de país
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="18091234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-[#1F1F1F] bg-[#1A1A1A] px-3 py-2.5 text-sm text-[#F5F5F5] placeholder-[#3F3F3F] focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {error != null && (
                <p className="text-xs text-red-400">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || phone.trim() === ''}
              className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-medium text-white transition-colors"
            >
              {isLoading ? 'Activando...' : 'Activar mi cuenta'}
            </button>
          </form>

          {/* Instrucción WhatsApp */}
          <div className="rounded-lg bg-[#0D1B0D] border border-[#1A3A1A] p-4 flex flex-col gap-2">
            <p className="text-xs font-medium text-green-400">Siguiente paso</p>
            <p className="text-xs text-[#71717A]">
              Después de activar, escríbele un mensaje a AXIS por WhatsApp para que empiece a conocerte.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
