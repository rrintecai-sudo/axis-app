'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';

interface NavItem {
  icon: string;
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: '📊', label: 'Dashboard', href: '/dashboard' },
  { icon: '✅', label: 'Tareas', href: '/tasks' },
  { icon: '📋', label: 'Briefs', href: '/briefs' },
  { icon: '⚙️', label: 'Configuración', href: '/settings' },
];

interface SidebarProps {
  userName?: string | null;
  userEmail?: string | null;
}

function getInitials(name?: string | null): string {
  if (name == null || name.trim() === '') return '?';
  return name
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export default function Sidebar({ userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const { signOut } = useClerk();

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-[#0A0A0A] border-r border-[#1F1F1F] flex flex-col z-20">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-[#1F1F1F]">
        <span className="text-2xl font-bold text-indigo-400 tracking-tight">
          AXIS
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={[
              'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors',
              isActive(item.href)
                ? 'bg-white/5 text-[#F5F5F5]'
                : 'text-[#71717A] hover:text-[#F5F5F5] hover:bg-white/5',
            ].join(' ')}
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User section */}
      <div className="px-4 py-4 border-t border-[#1F1F1F]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-indigo-300">
              {getInitials(userName)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            {userName != null && userName !== '' && (
              <p className="text-xs font-medium text-[#F5F5F5] truncate">{userName}</p>
            )}
            {userEmail != null && userEmail !== '' && (
              <p className="text-xs text-[#71717A] truncate">{userEmail}</p>
            )}
          </div>
        </div>

        <button
          onClick={() => void signOut({ redirectUrl: '/sign-in' })}
          className="w-full text-left text-xs text-[#71717A] hover:text-red-400 transition-colors px-1 py-1"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
