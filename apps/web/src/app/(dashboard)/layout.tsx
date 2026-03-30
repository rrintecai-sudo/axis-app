import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session == null) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Sidebar
        userName={session.user?.name ?? null}
        userEmail={session.user?.email ?? null}
      />

      {/* Main content offset by sidebar width */}
      <main className="ml-60 min-h-screen">
        <div className="max-w-5xl mx-auto px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
