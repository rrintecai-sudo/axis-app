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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#09090b' }}>

      {/* Sidebar: natural flex child, sticky so it stays while scrolling */}
      <Sidebar
        userName={user.name ?? null}
        userEmail={user.email}
      />

      {/* Main area: takes remaining space */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top Header: sticky inside the main column */}
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingLeft: 32,
          paddingRight: 32,
          background: 'rgba(9,9,11,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          {/* Avatar */}
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

        {/* Page content */}
        <main style={{ flex: 1 }}>
          <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 36px' }}>
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}
