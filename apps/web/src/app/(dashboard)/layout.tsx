import { getAxisUser } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAxisUser();

  return (
    <div className="min-h-screen" style={{ background: '#09090b' }}>
      <Sidebar
        userName={user.name ?? null}
        userEmail={user.email}
      />
      <main style={{ marginLeft: 240, minHeight: '100vh' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 36px' }}>{children}</div>
      </main>
    </div>
  );
}
