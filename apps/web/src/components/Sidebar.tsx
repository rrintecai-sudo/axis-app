'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function IconDashboard() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function IconTasks() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}
function IconBriefs() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}
function IconSignOut() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { icon: <IconDashboard />, label: 'Dashboard', href: '/dashboard' },
  { icon: <IconTasks />,    label: 'Tareas',     href: '/tasks' },
  { icon: <IconBriefs />,   label: 'Briefs',     href: '/briefs' },
  { icon: <IconSettings />, label: 'Configuración', href: '/settings' },
];

interface SidebarProps {
  userName?: string | null;
  userEmail?: string | null;
}

function getInitials(name?: string | null): string {
  if (name == null || name.trim() === '') return '?';
  return name.trim().split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

export default function Sidebar({ userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const { signOut } = useClerk();

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-60 flex flex-col z-20"
      style={{ background: '#060f09', borderRight: '1px solid rgba(34,197,94,0.12)' }}>

      {/* Logo */}
      <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(34,197,94,0.1)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <span style={{ color: '#22c55e', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>A</span>
          </div>
          <span style={{ color: '#4ade80', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.18em' }}>AXIS</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                color: active ? '#4ade80' : 'rgba(134,239,172,0.45)',
                background: active ? 'rgba(34,197,94,0.08)' : 'transparent',
                borderLeft: active ? '2px solid #22c55e' : '2px solid transparent',
              }}
            >
              <span style={{ opacity: active ? 1 : 0.6 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User + Sign out */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(34,197,94,0.1)' }}>
        {/* Avatar row */}
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
            style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#4ade80' }}>
            {getInitials(userName)}
          </div>
          <div className="flex-1 min-w-0">
            {userName && <p className="text-xs font-semibold truncate" style={{ color: '#f0fdf4' }}>{userName}</p>}
            {userEmail && <p className="text-xs truncate" style={{ color: 'rgba(134,239,172,0.5)' }}>{userEmail}</p>}
          </div>
        </div>

        {/* Sign out button */}
        <button
          onClick={() => void signOut({ redirectUrl: '/sign-in' })}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group"
          style={{ color: 'rgba(134,239,172,0.4)', border: '1px solid rgba(34,197,94,0.08)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = '#f87171';
            (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.06)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(248,113,113,0.2)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = 'rgba(134,239,172,0.4)';
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(34,197,94,0.08)';
          }}
        >
          <IconSignOut />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
