import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore.js';
import { listTrips } from '@/features/trips/tripApi.js';
import { useTheme } from '@/providers/ThemeProvider.jsx';
import { cn } from '@/lib/cn.js';

const primaryNav = [
  { to: '/dashboard', label: 'Dashboard', icon: 'home' },
  { to: '/trips', label: 'My Trips', icon: 'trips' },
  { to: '/expenses', label: 'Expenses', icon: 'expenses' },
  { to: '/explore', label: 'Explore', icon: 'explore' },
  { to: '/profile', label: 'Profile', icon: 'profile' },
];

const mobileNav = [
  { to: '/dashboard', label: 'Home' },
  { to: '/trips', label: 'Trips' },
  { to: '/trips/new/basics', label: 'Plan' },
  { to: '/expenses', label: 'Expenses' },
  { to: '/profile', label: 'Profile' },
];

export function AppShell({ children, title, subtitle, hidePackCta = false }) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const notifRef = useRef(null);
  const mobileNotifRef = useRef(null);
  const menuRef = useRef(null);

  const tripsQuery = useQuery({
    queryKey: ['trips'],
    queryFn: listTrips,
    staleTime: 30_000,
  });
  const activeTrip = (tripsQuery.data?.trips || []).find((t) => t.status === 'ACTIVE');

  useEffect(() => {
    const onDocClick = (e) => {
      const inDesktopNotif = notifRef.current?.contains(e.target);
      const inMobileNotif = mobileNotifRef.current?.contains(e.target);
      if (!inDesktopNotif && !inMobileNotif) setNotifOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/');
  };

  const navWithLive = activeTrip
    ? [
        ...primaryNav.slice(0, 2),
        { to: `/trips/${activeTrip.id}/live`, label: 'Live Trip', icon: 'live' },
        ...primaryNav.slice(2),
      ]
    : primaryNav;

  return (
    <div className="min-h-screen bg-[var(--surface-base)] transition-colors duration-300">
      {/* Desktop */}
      <div className="hidden md:flex min-h-screen">
        <aside
          className="w-64 shrink-0 border-r border-[var(--border-subtle)] bg-[var(--surface-raised)]/90 backdrop-blur-xl sticky top-0 h-screen flex flex-col px-4 py-6"
          style={{ boxShadow: 'var(--shadow-soft)' }}
        >
          <Link to="/dashboard" className="px-2 group">
            <span className="font-display text-2xl font-bold tracking-tight bg-gradient-to-r from-[var(--brand-strong)] to-[var(--brand-primary)] bg-clip-text text-transparent">
              YOLO
            </span>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)] mt-1">
              Your journey. Intelligently planned.
            </p>
          </Link>

          <nav className="mt-8 space-y-1 flex-1 overflow-y-auto">
            {navWithLive.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard' || item.to === '/trips' || item.to === '/expenses'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'yolo-btn-primary text-[var(--text-inverse)] shadow-md'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]',
                  )
                }
              >
                <NavGlyph name={item.icon} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="pt-4 border-t border-[var(--border-subtle)] px-1 space-y-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] transition-colors"
            >
              {theme === 'dark' ? '🌙' : '☀️'}
              {theme === 'dark' ? 'Dark mode' : 'Light mode'}
            </button>
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-0 z-20 bg-[var(--surface-glass)] backdrop-blur-xl border-b border-[var(--border-subtle)] px-8 py-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-display font-semibold text-[var(--text-primary)] truncate">
                {title || 'YOLO'}
              </p>
              {subtitle && (
                <p className="text-sm text-[var(--text-muted)] truncate">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative" ref={notifRef}>
                <IconButton
                  aria-label="Notifications"
                  onClick={() => {
                    setNotifOpen((v) => !v);
                    setMenuOpen(false);
                  }}
                >
                  <BellIcon />
                </IconButton>
                {notifOpen && <DropdownPanel>No new notifications</DropdownPanel>}
              </div>

              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  aria-label="Account menu"
                  onClick={() => {
                    setMenuOpen((v) => !v);
                    setNotifOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-raised)] pl-1.5 pr-3 py-1.5 hover:border-[var(--border-strong)] transition-colors"
                >
                  <Avatar user={user} size="sm" />
                  <span className="hidden lg:inline text-sm font-medium text-[var(--text-primary)] max-w-[120px] truncate">
                    {user?.name?.split(' ')[0] || 'You'}
                  </span>
                  <ChevronIcon />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] py-2 z-30" style={{ boxShadow: 'var(--shadow-card)' }}>
                    <DropdownLink to="/profile" onClick={() => setMenuOpen(false)}>
                      Profile
                    </DropdownLink>
                    <DropdownLink to="/settings" onClick={() => setMenuOpen(false)}>
                      Settings
                    </DropdownLink>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>

              {!hidePackCta && (
                <Link
                  to="/trips/new/basics"
                  className="rounded-full bg-gradient-to-r from-teal-600 to-ocean-700 hover:from-teal-500 hover:to-ocean-600 text-white text-sm font-semibold px-4 py-2.5 transition-all shadow-md"
                >
                  Plan My Journey
                </Link>
              )}
            </div>
          </header>
          <main className="px-8 py-8 pb-16 flex-1">{children}</main>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden min-h-screen pb-24">
        <header className="sticky top-0 z-20 bg-[var(--surface-glass)] backdrop-blur-xl border-b border-[var(--border-subtle)] px-4 py-3 flex items-center justify-between">
          <div>
            <Link
              to="/dashboard"
              className="font-display font-bold text-[var(--text-primary)] text-lg"
            >
              YOLO
            </Link>
            {title && title !== 'YOLO' && (
              <p className="text-xs text-[var(--text-muted)] truncate max-w-[180px]">{title}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeTrip && (
              <Link
                to={`/trips/${activeTrip.id}/live`}
                className="rounded-full bg-gradient-to-r from-teal-500 to-ocean-600 text-white text-xs font-semibold px-3 py-1.5"
              >
                Live
              </Link>
            )}
            <IconButton aria-label="Toggle theme" onClick={toggleTheme}>
              {theme === 'dark' ? '🌙' : '☀️'}
            </IconButton>
            <div className="relative" ref={mobileNotifRef}>
              <IconButton aria-label="Notifications" onClick={() => setNotifOpen((v) => !v)}>
                <BellIcon />
              </IconButton>
              {notifOpen && (
                <DropdownPanel className="w-56 p-3">No new notifications</DropdownPanel>
              )}
            </div>
            <Link
              to="/trips/new/basics"
              className="rounded-full bg-gradient-to-r from-teal-600 to-ocean-700 text-white text-xs font-semibold px-3 py-1.5"
            >
              Plan
            </Link>
          </div>
        </header>
        <main className="px-4 py-6">{children}</main>
        <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-[var(--border-subtle)] bg-[var(--surface-glass)] backdrop-blur-xl px-1 py-2 grid grid-cols-5 gap-0.5 safe-area-pb">
          {mobileNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard' || item.to === '/expenses'}
              className={({ isActive }) => {
                const planning =
                  item.label === 'Plan' && location.pathname.startsWith('/trips/new');
                return cn(
                  'text-center text-[11px] font-medium py-2 rounded-xl transition-colors',
                  isActive || planning
                    ? 'text-[var(--brand-primary)] bg-[var(--brand-soft)]'
                    : 'text-[var(--text-muted)]',
                );
              }}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

function IconButton({ children, className, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'h-10 w-10 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-raised)] flex items-center justify-center text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)] transition-colors',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function DropdownPanel({ children, className }) {
  return (
    <div
      className={cn(
        'absolute right-0 mt-2 w-64 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-4 z-30 text-sm text-[var(--text-secondary)]',
        className,
      )}
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {children}
    </div>
  );
}

function DropdownLink({ to, onClick, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
    >
      {children}
    </Link>
  );
}

function Avatar({ user, size = 'md' }) {
  const dim = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-9 w-9 text-sm';
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [user?.avatarUrl]);

  if (user?.avatarUrl && !failed) {
    return (
      <img
        src={user.avatarUrl}
        alt=""
        className={`${dim} rounded-full object-cover shrink-0`}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div
      className={`${dim} rounded-full bg-gradient-to-br from-teal-400 to-ocean-600 text-white flex items-center justify-center font-semibold`}
    >
      {user?.name?.[0] || 'Y'}
    </div>
  );
}

function BellIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-[var(--text-muted)] hidden lg:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function NavGlyph({ name }) {
  const common = 'w-4 h-4 opacity-80';
  if (name === 'home') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5z" />
      </svg>
    );
  }
  if (name === 'trips') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 7h18M5 7v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      </svg>
    );
  }
  if (name === 'expenses') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18M7 15h2" />
      </svg>
    );
  }
  if (name === 'explore') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="m16 8-2.5 6.5L7 17l2.5-6.5L16 8z" />
      </svg>
    );
  }
  if (name === 'profile') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
      </svg>
    );
  }
  if (name === 'live') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M5 19l1.5-1.5" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}
