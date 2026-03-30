'use client';

import { useEffect } from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('[AXIS] Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <span className="text-3xl">⚠</span>
        <h2 className="text-base font-semibold text-[#F5F5F5]">
          Algo salió mal
        </h2>
        <p className="text-sm text-[#71717A]">
          {error.message !== ''
            ? error.message
            : 'Ocurrió un error inesperado. Por favor, intenta de nuevo.'}
        </p>
        <button
          onClick={reset}
          className="mt-2 px-4 py-2 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-sm text-indigo-400 hover:bg-indigo-500/25 transition-colors"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
