'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/tasks',     label: 'Tareas' },
  { href: '/briefs',    label: 'Briefs' },
  { href: '/settings',  label: 'Configuración' },
];

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
      className="fixed inset-y-0 left-0 w-60 flex flex-col z-20"
      style={{ background: 'linear-gradient(180deg,#071410 0%,#060f09 100%)', borderRight: '1px solid rgba(34,197,94,0.13)' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(34,197,94,0.1)' }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
          style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', boxShadow: '0 0 12px rgba(34,197,94,0.15)' }}
        >
          A
        </div>
        <span style={{ color: '#4ade80', fontWeight: 800, fontSize: '1rem', letterSpacing: '0.2em' }}>AXIS</span>
        <span
          className="ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          BETA
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
        {NAV.map(item => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150"
              style={{
                color: active ? '#f0fdf4' : 'rgba(134,239,172,0.4)',
                background: active ? 'rgba(34,197,94,0.12)' : 'transparent',
                boxShadow: active ? 'inset 0 0 0 1px rgba(34,197,94,0.2)' : 'none',
              }}
            >
              {item.label}
              {active && (
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + Sign out */}
      <div className="px-3 pb-4 flex flex-col gap-2" style={{ borderTop: '1px solid rgba(34,197,94,0.1)', paddingTop: '1rem' }}>
        {/* User card */}
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.1)' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80' }}
          >
            {initials(userName)}
          </div>
          <div className="flex-1 min-w-0">
            {userName && <p className="text-xs font-semibold truncate" style={{ color: '#f0fdf4' }}>{userName}</p>}
            {userEmail && <p className="text-xs truncate" style={{ color: 'rgba(134,239,172,0.45)' }}>{userEmail}</p>}
          </div>
        </div>

        {/* Sign out — red, always visible */}
        <button
          onClick={() => void signOut({ redirectUrl: '/sign-in' })}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}
        >
          Cerrar sesión →
        </button>
      </div>
    </aside>
  );
}
