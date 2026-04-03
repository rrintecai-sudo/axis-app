import { getAxisUser } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAxisUser();

  return (
    <div className="min-h-screen" style={{ background: '#060f09' }}>
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
