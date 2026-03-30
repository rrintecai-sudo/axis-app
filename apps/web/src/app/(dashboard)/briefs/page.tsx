import { auth } from '@/lib/auth';
import { getBriefs } from '@/lib/api';
import BriefCard from '@/components/BriefCard';

export default async function BriefsPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id ?? '';

  const briefs = await getBriefs(userId);

  // Sort descending by date
  const sorted = [...briefs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-[#F5F5F5]">Briefs</h1>
        <p className="text-sm text-[#71717A]">
          Historial de tus briefings diarios generados por AXIS.
        </p>
      </div>

      {/* Count */}
      {sorted.length > 0 && (
        <p className="text-xs text-[#71717A]">
          {sorted.length} brief{sorted.length !== 1 ? 's' : ''} en total
        </p>
      )}

      {/* List */}
      {sorted.length > 0 ? (
        <div className="flex flex-col gap-4">
          {sorted.map((brief) => (
            <BriefCard key={brief.id} brief={brief} compact />
          ))}
        </div>
      ) : (
        <div className="rounded-lg bg-[#111111] border border-[#1F1F1F] p-12 flex flex-col items-center gap-3">
          <span className="text-3xl">📋</span>
          <p className="text-sm text-[#71717A] text-center">
            Aún no tienes briefs.
            <br />
            AXIS generará tu primer brief mañana por la mañana vía WhatsApp.
          </p>
        </div>
      )}
    </div>
  );
}
