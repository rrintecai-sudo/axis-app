import { Brief } from '@/lib/api';

interface BriefCardProps {
  brief: Brief;
  compact?: boolean;
}

function formatDateEs(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function BriefCard({ brief, compact = false }: BriefCardProps) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: 'linear-gradient(135deg,#0a1a0f 0%,#071410 100%)', border: '1px solid rgba(34,197,94,0.15)' }}
    >
      <p className="text-[10px] font-semibold capitalize tracking-[0.15em] uppercase" style={{ color: 'rgba(34,197,94,0.55)' }}>
        {formatDateEs(brief.date)}
      </p>

      {brief.topTask && (
        <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.15)' }}>
          <span className="shrink-0 mt-0.5" style={{ color: '#22c55e' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </span>
          <p className="text-sm font-semibold leading-snug" style={{ color: '#4ade80' }}>{brief.topTask}</p>
        </div>
      )}

      {brief.topPriorities.length > 0 && (
        <ul className="flex flex-col gap-2">
          {brief.topPriorities.map((p, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
                {i + 1}
              </span>
              <span style={{ color: '#f0fdf4' }}>{p}</span>
            </li>
          ))}
        </ul>
      )}

      {brief.content && (
        <p className={`text-sm leading-relaxed ${compact ? 'line-clamp-3' : ''}`} style={{ color: 'rgba(240,253,244,0.5)' }}>
          {brief.content}
        </p>
      )}
    </div>
  );
}
