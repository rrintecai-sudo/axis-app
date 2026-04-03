'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';

const NAV = [
  {
    href: '/dashboard',
    label: 'Inicio',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    href: '/tasks',
    label: 'Tareas',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  },
  {
    href: '/briefs',
    label: 'Briefs',
    icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z',
  },
  {
    href: '/settings',
    label: 'Ajustes',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },
];

function Icon({ d }: { d: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      width="18"
      height="18"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {d.split(' M').map((segment, i) => (
        <path key={i} d={i === 0 ? segment : `M${segment}`} />
      ))}
    </svg>
  );
}

function initials(name?: string | null) {
  if (!name?.trim()) return '?';
  return name.trim().split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}

export default function Sidebar({ userName, userEmail }: { userName?: string | null; userEmail?: string | null }) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside
      className="fixed inset-y-0 left-0 w-56 flex flex-col z-20"
      style={{
        background: '#0e0e10',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* ── Logo ── */}
      <div className="h-14 flex items-center px-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded flex items-center justify-center text-[11px] font-black"
            style={{ background: '#22c55e', color: '#000' }}
          >
            A
          </div>
          <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.12em' }}>
            AXIS
          </span>
        </div>
        <span
          className="ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
          style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          BETA
        </span>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2 py-3">
        <p className="px-3 pb-2 text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Menú
        </p>
        {NAV.map(item => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-medium transition-all"
              style={{
                background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                color: active ? '#f8fafc' : 'rgba(255,255,255,0.38)',
              }}
            >
              <span style={{ color: active ? '#22c55e' : 'rgba(255,255,255,0.3)' }}>
                <Icon d={item.icon} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom ── */}
      <div className="px-3 py-3 flex flex-col gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {/* User row */}
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold"
            style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80' }}
          >
            {initials(userName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold truncate" style={{ color: '#e2e8f0' }}>
              {userName ?? 'Usuario'}
            </p>
            {userEmail && (
              <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.28)' }}>
                {userEmail}
              </p>
            )}
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={() => void signOut({ redirectUrl: '/sign-in' })}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[13px] font-semibold transition-all"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.22)',
            color: '#f87171',
          }}
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
