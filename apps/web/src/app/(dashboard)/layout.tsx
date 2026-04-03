import { getAxisUser } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

function initials(name?: string | null) {
  if (!name?.trim()) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAxisUser();
  const userInitials = initials(user.name);

  return (
    <div style={{ minHeight: '100vh', background: '#09090b' }}>
      {/* Fixed Sidebar */}
      <Sidebar
        userName={user.name ?? null}
        userEmail={user.email}
      />

      {/* Main area offset by sidebar width */}
      <div style={{ marginLeft: 220, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Top Header */}
        <header style={{
          position: 'fixed',
          top: 0,
          left: 220,
          right: 0,
          height: 56,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 32,
          paddingRight: 32,
          background: 'rgba(9,9,11,0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          {/* Left: breadcrumb placeholder */}
          <div />

          {/* Right: avatar */}
          <div style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: '#22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: '#000',
            flexShrink: 0,
          }}>
            {userInitials}
          </div>
        </header>

        {/* Page content with top padding to clear the fixed header */}
        <main style={{ paddingTop: 56, flex: 1 }}>
          <div style={{ maxWidth: 960, margin: '0 auto', padding: '36px 36px' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
