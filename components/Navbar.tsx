'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import type { User } from '@supabase/supabase-js';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/mind-cloud', label: 'Mind Cloud' },
  { href: '/market-trends', label: 'Market Trends' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [refreshState, setRefreshState] = useState<'idle' | 'sent'>('idle');

  // Create client inside useEffect only — avoids SSR prerender crash
  // when NEXT_PUBLIC_SUPABASE_URL is not yet set in the build environment
  useEffect(() => {
    const supabase = createClient();
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleRefresh = async () => {
    setRefreshState('sent');
    try {
      // Await the full refresh — the server runs data collection and DB writes,
      // then returns. maxDuration = 300s on the route (requires Vercel Pro).
      await fetch('/api/refresh', { method: 'POST' });
    } catch {
      // Network error or timeout — still reset so the user can retry
    } finally {
      setRefreshState('idle');
      // Reload the current page so fresh data appears immediately
      window.location.reload();
    }
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      <nav className="bg-verint-purple-deeper shadow-verint-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">

            {/* Logo — simple V badge + app name */}
            <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="w-10 h-10 flex-shrink-0 rounded-full bg-white flex items-center
                              justify-center ring-2 ring-white ring-opacity-20
                              group-hover:ring-opacity-50 transition-all shadow-md">
                <span className="text-verint-purple font-black text-sm">V</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-white font-bold text-base leading-tight tracking-wide">
                  Verint FI Intel
                </div>
                <div className="text-verint-purple-pale text-xs leading-tight opacity-75">
                  Financial Security Intelligence
                </div>
              </div>
            </Link>

            {/* Desktop Nav Links + Refresh */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive(href)
                      ? 'bg-verint-purple text-white shadow-md'
                      : 'text-verint-purple-pale hover:bg-verint-purple hover:bg-opacity-40 hover:text-white'
                  }`}
                >
                  {label}
                </Link>
              ))}

              {/* Refresh Data button */}
              <button
                onClick={handleRefresh}
                disabled={refreshState === 'sent'}
                className={`ml-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  refreshState === 'sent'
                    ? 'bg-green-700 bg-opacity-40 text-green-200 cursor-wait'
                    : 'text-verint-purple-pale border border-verint-purple border-opacity-50 hover:bg-verint-purple hover:bg-opacity-40 hover:text-white'
                }`}
              >
                {refreshState === 'sent' ? '⏳ Refreshing…' : '↻ Refresh Data'}
              </button>
            </div>

            {/* Auth section — hidden until login is re-enabled */}
            {user && (
              <div className="hidden md:flex items-center gap-3">
                <span className="text-verint-purple-pale text-xs truncate max-w-[140px]">
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-verint-purple hover:bg-verint-purple-light text-white text-sm font-medium
                             px-4 py-2 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden text-white p-2 rounded-lg hover:bg-verint-purple transition-colors"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-verint-purple-dark border-t border-verint-purple px-4 py-4 space-y-2">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(href)
                    ? 'bg-verint-purple text-white'
                    : 'text-verint-purple-pale hover:bg-verint-purple hover:text-white'
                }`}
              >
                {label}
              </Link>
            ))}

            {/* Mobile Refresh button */}
            <button
              onClick={() => { handleRefresh(); setMenuOpen(false); }}
              disabled={refreshState === 'sent'}
              className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                refreshState === 'sent'
                  ? 'bg-green-700 bg-opacity-40 text-green-200 cursor-wait'
                  : 'text-verint-purple-pale hover:bg-verint-purple hover:text-white'
              }`}
            >
              {refreshState === 'sent' ? '⏳ Refreshing…' : '↻ Refresh Data'}
            </button>

            {/* Auth section — hidden until login is re-enabled */}
            {user && (
              <div className="border-t border-verint-purple pt-3 mt-3 space-y-2">
                <div className="text-verint-purple-pale text-xs px-4 truncate">{user.email}</div>
                <button
                  onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="block w-full text-left px-4 py-2.5 text-sm text-white bg-verint-purple rounded-lg"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Refresh status banner — appears below navbar when refresh is in progress */}
      {refreshState === 'sent' && (
        <div className="bg-green-700 text-white text-sm text-center py-2.5 px-4 sticky top-16 z-40 shadow-md">
          <span className="font-medium">Thank you for your patience.</span>
          {' '}Data refresh is in progress — this may take a few minutes.
        </div>
      )}
    </>
  );
}
