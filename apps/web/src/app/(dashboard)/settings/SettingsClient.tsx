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
  return `w-full rounded-lg bg-[#0A0A0A] border border-[#1F1F1F] px-4 py-2.5 text-sm text-[#F5F5F5] outline-none focus:border-indigo-500/60 transition-colors placeholder:text-[#71717A] ${extra}`;
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
      <section className="rounded-xl bg-[#111111] border border-[#1F1F1F] p-6 flex flex-col gap-5">
        <h2 className="text-sm font-semibold text-[#F5F5F5]">
          Información personal
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#71717A]">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className={inputClass()}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#71717A]">Email</label>
            <input
              type="email"
              value={userEmail ?? ''}
              disabled
              className={inputClass('opacity-50 cursor-not-allowed')}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-[#71717A]">Zona horaria</label>
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
            <label className="text-xs text-[#71717A]">
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
            <label className="text-xs text-[#71717A]">
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
      <section className="rounded-xl bg-[#111111] border border-[#1F1F1F] p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-[#F5F5F5]">
            Tus roles
          </h2>
          <p className="text-xs text-[#71717A]">
            Selecciona todos los que apliquen. AXIS contextualizará sus
            recomendaciones.
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
                className={[
                  'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                  active
                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                    : 'bg-transparent border-[#1F1F1F] text-[#71717A] hover:text-[#F5F5F5] hover:border-[#2A2A2A]',
                ].join(' ')}
              >
                {role.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Life areas */}
      <section className="rounded-xl bg-[#111111] border border-[#1F1F1F] p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-[#F5F5F5]">
            Áreas de vida
          </h2>
          <p className="text-xs text-[#71717A]">
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
                className="flex items-center gap-3 rounded-lg bg-[#0A0A0A] border border-[#1F1F1F] px-4 py-3"
              >
                {/* Order buttons */}
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveLifeArea(area.name, 'up')}
                    className="text-[#71717A] hover:text-[#F5F5F5] disabled:opacity-20 disabled:cursor-not-allowed text-xs leading-none"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={idx === lifeAreas.length - 1}
                    onClick={() => moveLifeArea(area.name, 'down')}
                    className="text-[#71717A] hover:text-[#F5F5F5] disabled:opacity-20 disabled:cursor-not-allowed text-xs leading-none"
                  >
                    ▼
                  </button>
                </div>

                {/* Order number */}
                <span className="text-xs text-[#71717A] w-5 text-right">
                  {idx + 1}
                </span>

                {/* Name */}
                <span
                  className={`flex-1 text-sm ${area.active ? 'text-[#F5F5F5]' : 'text-[#71717A]'}`}
                >
                  {area.name}
                </span>

                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => toggleLifeArea(area.name)}
                  className={[
                    'relative inline-flex h-5 w-9 items-center rounded-full border transition-colors shrink-0',
                    area.active
                      ? 'bg-indigo-500/30 border-indigo-500/40'
                      : 'bg-[#1F1F1F] border-[#2A2A2A]',
                  ].join(' ')}
                  aria-label={`${area.active ? 'Desactivar' : 'Activar'} ${area.name}`}
                >
                  <span
                    className={[
                      'inline-block h-3.5 w-3.5 rounded-full transition-transform',
                      area.active
                        ? 'translate-x-4 bg-indigo-400'
                        : 'translate-x-1 bg-[#71717A]',
                    ].join(' ')}
                  />
                </button>
              </div>
            ))}
        </div>
      </section>

      {/* Quarterly goals */}
      <section className="rounded-xl bg-[#111111] border border-[#1F1F1F] p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-[#F5F5F5]">
            Objetivos del trimestre
          </h2>
          <p className="text-xs text-[#71717A]">
            Un objetivo por línea. AXIS los tendrá en cuenta al priorizar tus
            tareas.
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
          <p className="text-sm text-emerald-400">
            ✓ Cambios guardados correctamente.
          </p>
        )}
        {saveResult === 'error' && (
          <p className="text-sm text-red-400">
            Ocurrió un error al guardar. Intenta de nuevo.
          </p>
        )}
        {saveResult === null && <span />}

        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving && (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
