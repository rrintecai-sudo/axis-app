import Link from 'next/link';

export default function OnboardingBanner() {
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-5 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="text-amber-400 text-lg shrink-0">⚠</span>
        <p className="text-sm text-amber-200">
          Completa tu perfil para que AXIS te conozca mejor y pueda
          preparar briefs personalizados.
        </p>
      </div>
      <Link
        href="/settings"
        className="shrink-0 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap"
      >
        Ir a Configuración →
      </Link>
    </div>
  );
}
