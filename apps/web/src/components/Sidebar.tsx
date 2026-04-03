'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';

function initials(name?: string | null) {
  if (!name?.trim()) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}

export default function Sidebar({ userName, userEmail }: { userName?: string | null; userEmail?: string | null }) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const IcoHome = () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  );
  const IcoTask = () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="3" y="5" width="6" height="6" rx="1"/>
      <path d="M3 15h18M3 19h18M13 7h8"/>
    </svg>
  );
  const IcoBrief = () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
    </svg>
  );
  const IcoGear = () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  );
  const IcoLogout = () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );

  const NAV = [
    { href: '/dashboard', label: 'Inicio',        Icon: IcoHome  },
    { href: '/tasks',     label: 'Tareas',         Icon: IcoTask  },
    { href: '/briefs',    label: 'Briefs',          Icon: IcoBrief },
    { href: '/settings',  label: 'Configuración',  Icon: IcoGear  },
  ];

  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      height: '100vh',
      position: 'sticky',
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      background: '#141417',
      borderRight: '1px solid rgba(255,255,255,0.05)',
      zIndex: 20,
    }}>

      {/* Logo */}
      <div style={{ padding: '22px 18px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: '#22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: 14,
            color: '#000',
            letterSpacing: 1,
            flexShrink: 0,
          }}>A</div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '0.14em', color: '#ffffff' }}>AXIS</span>
          <span style={{
            marginLeft: 'auto',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.1em',
            padding: '2px 7px',
            borderRadius: 20,
            background: 'rgba(34,197,94,0.12)',
            color: '#4ade80',
            border: '1px solid rgba(34,197,94,0.2)',
            flexShrink: 0,
          }}>BETA</span>
        </div>
      </div>

      {/* Nav */}
      <div role="navigation" style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ href, label, Icon }) => {
          const on = active(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '9px 12px',
                borderRadius: 10,
                fontSize: 13.5,
                fontWeight: on ? 600 : 400,
                color: on ? '#000000' : 'rgba(255,255,255,0.5)',
                background: on ? '#22c55e' : 'transparent',
                textDecoration: 'none',
              }}
            >
              <span style={{ color: on ? '#000000' : 'rgba(255,255,255,0.5)', display: 'flex' }}>
                <Icon />
              </span>
              {label}
            </Link>
          );
        })}
      </div>

      {/* Usuario */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '14px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px 12px' }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            flexShrink: 0,
            background: 'rgba(34,197,94,0.18)',
            border: '1.5px solid rgba(34,197,94,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: '#4ade80',
          }}>
            {initials(userName)}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{
              margin: 0,
              fontSize: 12.5,
              fontWeight: 600,
              color: '#e2e8f0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {userName ?? 'Mi cuenta'}
            </p>
            {userEmail && (
              <p style={{
                margin: 0,
                fontSize: 10.5,
                color: 'rgba(255,255,255,0.3)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {userEmail}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => void signOut({ redirectUrl: '/sign-in' })}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '9px 0',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            color: '#fca5a5',
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.25)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.2)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.12)'; }}
        >
          <IcoLogout /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
