'use client';

import { useState, FormEvent } from 'react';
import { UserProfile, LifeArea, updateUserProfile } from '@/lib/api';

const AVAILABLE_ROLES = [
  { value: 'empresario', label: 'Empresario' },
  { value: 'padre', label: 'Padre / Madre' },
  { value: 'lider', label: 'Líder' },
  { value: 'profesional', label: 'Profesional' },
  { value: 'otro', label: 'Otro' },
];

const DEFAULT_LIFE_AREAS: LifeArea[] = [
  { name: 'Trabajo', order: 1, active: true },
  { name: 'Familia', order: 2, active: true },
  { name: 'Salud', order: 3, active: true },
  { name: 'Finanzas', order: 4, active: true },
  { name: 'Fe / Espiritualidad', order: 5, active: false },
  { name: 'Aprendizaje', order: 6, active: false },
  { name: 'Comunidad', order: 7, active: false },
];

const TIMEZONES = [
  'America/Caracas',
  'America/Bogota',
  'America/Lima',
  'America/Santiago',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/Buenos_Aires',
  'America/Sao_Paulo',
  'Europe/Madrid',
  'UTC',
];

interface SettingsClientProps {
  userId: string;
  initialProfile: UserProfile | null;
  userEmail?: string;
}

function inputClass(extra = '') {
  return `w-full rounded-lg bg-[#060f09] border border-[rgba(34,197,94,0.12)] px-4 py-2.5 text-sm text-[#f0fdf4] outline-none focus:border-[rgba(34,197,94,0.5)] transition-colors placeholder:text-[rgba(134,239,172,0.3)] ${extra}`;
}

export default function SettingsClient({
  userId,
  initialProfile,
  userEmail,
}: SettingsClientProps) {
  const [name, setName] = useState(initialProfile?.name ?? '');
  const [timezone, setTimezone] = useState(
    initialProfile?.timezone ?? 'America/Caracas',
  );
  const [wakeUpTime, setWakeUpTime] = useState(
    initialProfile?.wakeUpTime ?? '06:00',
  );
  const [sleepTime, setSleepTime] = useState(
    initialProfile?.sleepTime ?? '22:00',
  );
  const [roles, setRoles] = useState<string[]>(
    initialProfile?.roles ?? [],
  );
  const [lifeAreas, setLifeAreas] = useState<LifeArea[]>(
    initialProfile?.lifeAreas ?? DEFAULT_LIFE_AREAS,
  );
  const [quarterlyGoals, setQuarterlyGoals] = useState<string>(
    (initialProfile?.quarterlyGoals ?? []).join('\n'),
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<'success' | 'error' | null>(
    null,
  );

  function toggleRole(value: string) {
    setRoles((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value],
    );
  }

  function toggleLifeArea(name: string) {
    setLifeAreas((prev) =>
      prev.map((a) => (a.name === name ? { ...a, active: !a.active } : a)),
    );
  }

  function moveLifeArea(name: string, direction: 'up' | 'down') {
    setLifeAreas((prev) => {
      const idx = prev.findIndex((a) => a.name === name);
      if (idx < 0) return prev;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;

      const next = [...prev];
      const temp = next[idx];
      const swapItem = next[swapIdx];

      if (temp == null || swapItem == null) return prev;

      next[idx] = { ...swapItem, order: temp.order };
      next[swapIdx] = { ...temp, order: swapItem.order };
      return next.sort((a, b) => a.order - b.order);
    });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    setSaveResult(null);

    try {
      const goals = quarterlyGoals
        .split('\n')
        .map((g) => g.trim())
        .filter((g) => g !== '');

      await updateUserProfile(userId, {
        name,
        timezone,
        wakeUpTime,
        sleepTime,
        roles,
        lifeAreas: lifeAreas.map((a, i) => ({ ...a, order: i + 1 })),
        quarterlyGoals: goals,
      });

      setSaveResult('success');
    } catch {
      setSaveResult('error');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveResult(null), 3500);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-8">
      {/* Personal info */}
      <section className="rounded-xl p-6 flex flex-col gap-5" style={{ background: '#0a1a0f', border: '1px solid rgba(34,197,94,0.12)' }}>
        <h2 className="text-sm font-semibold" style={{ color: '#f0fdf4' }}>
          Información personal
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs" style={{ color: 'rgba(134,239,172,0.5)' }}>Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className={inputClass()}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs" style={{ color: 'rgba(134,239,172,0.5)' }}>Email</label>
            <input
              type="email"
              value={userEmail ?? ''}
              disabled
              className={inputClass('opacity-50 cursor-not-allowed')}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs" style={{ color: 'rgba(134,239,172,0.5)' }}>Zona horaria</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className={inputClass()}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs" style={{ color: 'rgba(134,239,172,0.5)' }}>
              Hora del brief (despertar)
            </label>
            <input
              type="time"
              value={wakeUpTime}
              onChange={(e) => setWakeUpTime(e.target.value)}
              className={inputClass()}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs" style={{ color: 'rgba(134,239,172,0.5)' }}>
              Hora de cierre (dormir)
            </label>
            <input
              type="time"
              value={sleepTime}
              onChange={(e) => setSleepTime(e.target.value)}
              className={inputClass()}
            />
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="rounded-xl p-6 flex flex-col gap-4" style={{ background: '#0a1a0f', border: '1px solid rgba(34,197,94,0.12)' }}>
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold" style={{ color: '#f0fdf4' }}>Tus roles</h2>
          <p className="text-xs" style={{ color: 'rgba(134,239,172,0.5)' }}>
            Selecciona todos los que apliquen. AXIS contextualizará sus recomendaciones.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {AVAILABLE_ROLES.map((role) => {
            const active = roles.includes(role.value);
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => toggleRole(role.value)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: active ? 'rgba(34,197,94,0.12)' : 'transparent',
                  border: `1px solid ${active ? 'rgba(34,197,94,0.4)' : 'rgba(34,197,94,0.1)'}`,
                  color: active ? '#4ade80' : 'rgba(134,239,172,0.45)',
                }}
              >
                {role.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Life areas */}
      <section className="rounded-xl p-6 flex flex-col gap-4" style={{ background: '#0a1a0f', border: '1px solid rgba(34,197,94,0.12)' }}>
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold" style={{ color: '#f0fdf4' }}>Áreas de vida</h2>
          <p className="text-xs" style={{ color: 'rgba(134,239,172,0.5)' }}>
            Activa las áreas relevantes y ordénalas por prioridad.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {lifeAreas
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((area, idx) => (
              <div
                key={area.name}
                className="flex items-center gap-3 rounded-lg px-4 py-3"
                style={{ background: '#060f09', border: '1px solid rgba(34,197,94,0.1)' }}
              >
                <div className="flex flex-col gap-0.5">
                  <button type="button" disabled={idx === 0} onClick={() => moveLifeArea(area.name, 'up')}
                    className="disabled:opacity-20 disabled:cursor-not-allowed text-xs leading-none transition-colors"
                    style={{ color: 'rgba(134,239,172,0.4)' }}>▲</button>
                  <button type="button" disabled={idx === lifeAreas.length - 1} onClick={() => moveLifeArea(area.name, 'down')}
                    className="disabled:opacity-20 disabled:cursor-not-allowed text-xs leading-none transition-colors"
                    style={{ color: 'rgba(134,239,172,0.4)' }}>▼</button>
                </div>

                <span className="text-xs w-5 text-right" style={{ color: 'rgba(134,239,172,0.3)' }}>{idx + 1}</span>

                <span className="flex-1 text-sm" style={{ color: area.active ? '#f0fdf4' : 'rgba(134,239,172,0.35)' }}>
                  {area.name}
                </span>

                <button
                  type="button"
                  onClick={() => toggleLifeArea(area.name)}
                  className="relative inline-flex h-5 w-9 items-center rounded-full transition-all shrink-0"
                  style={{
                    background: area.active ? 'rgba(34,197,94,0.25)' : 'rgba(34,197,94,0.06)',
                    border: `1px solid ${area.active ? 'rgba(34,197,94,0.5)' : 'rgba(34,197,94,0.12)'}`,
                  }}
                  aria-label={`${area.active ? 'Desactivar' : 'Activar'} ${area.name}`}
                >
                  <span
                    className="inline-block h-3.5 w-3.5 rounded-full transition-transform"
                    style={{
                      transform: area.active ? 'translateX(1rem)' : 'translateX(0.25rem)',
                      background: area.active ? '#22c55e' : 'rgba(134,239,172,0.3)',
                    }}
                  />
                </button>
              </div>
            ))}
        </div>
      </section>

      {/* Quarterly goals */}
      <section className="rounded-xl p-6 flex flex-col gap-4" style={{ background: '#0a1a0f', border: '1px solid rgba(34,197,94,0.12)' }}>
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold" style={{ color: '#f0fdf4' }}>Objetivos del trimestre</h2>
          <p className="text-xs" style={{ color: 'rgba(134,239,172,0.5)' }}>
            Un objetivo por línea. AXIS los tendrá en cuenta al priorizar tus tareas.
          </p>
        </div>

        <textarea
          value={quarterlyGoals}
          onChange={(e) => setQuarterlyGoals(e.target.value)}
          rows={5}
          placeholder={'Lanzar MVP del producto\nLlegar a 10 clientes\nCorrer 5K semanales'}
          className={inputClass('resize-none leading-relaxed')}
        />
      </section>

      {/* Submit */}
      <div className="flex items-center justify-between gap-4">
        {saveResult === 'success' && (
          <p className="text-sm" style={{ color: '#4ade80' }}>✓ Cambios guardados correctamente.</p>
        )}
        {saveResult === 'error' && (
          <p className="text-sm text-red-400">Ocurrió un error al guardar. Intenta de nuevo.</p>
        )}
        {saveResult === null && <span />}

        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ background: '#22c55e', color: '#000' }}
        >
          {isSaving && (
            <span className="w-3.5 h-3.5 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" />
          )}
          {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
