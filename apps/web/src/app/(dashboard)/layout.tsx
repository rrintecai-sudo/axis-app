import { getAxisUser } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAxisUser();

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Sidebar
        userName={user.name ?? null}
        userEmail={user.email}
      />
      <main className="ml-60 min-h-screen">
        <div className="max-w-5xl mx-auto px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
