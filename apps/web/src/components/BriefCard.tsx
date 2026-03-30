import { Brief } from '@/lib/api';

interface BriefCardProps {
  brief: Brief;
  compact?: boolean;
}

function formatDateEs(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function BriefCard({ brief, compact = false }: BriefCardProps) {
  return (
    <div className="rounded-lg bg-[#111111] border border-[#1F1F1F] p-5 flex flex-col gap-3">
      {/* Date */}
      <p className="text-xs text-[#71717A] capitalize font-medium tracking-wide">
        {formatDateEs(brief.date)}
      </p>

      {/* Top task */}
      {brief.topTask != null && brief.topTask !== '' && (
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-indigo-400 shrink-0">▶</span>
          <p className="text-sm font-semibold text-indigo-300 leading-snug">
            {brief.topTask}
          </p>
        </div>
      )}

      {/* Top priorities */}
      {brief.topPriorities.length > 0 && (
        <ul className="flex flex-col gap-1">
          {brief.topPriorities.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[#F5F5F5]">
              <span className="text-[#71717A] shrink-0">{i + 1}.</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Content preview */}
      {brief.content !== '' && (
        <p
          className={[
            'text-sm text-[#71717A] leading-relaxed',
            compact ? 'line-clamp-3' : '',
          ].join(' ')}
        >
          {brief.content}
        </p>
      )}
    </div>
  );
}
