export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-[#1F1F1F] border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-sm text-[#71717A]">Cargando...</p>
      </div>
    </div>
  );
}
