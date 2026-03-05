'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import type { User } from '@supabase/supabase-js';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/mind-cloud', label: 'Mind Cloud' },
  { href: '/word-map', label: 'Word Map' },
  { href: '/market-trends', label: 'Market Trends' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav className="bg-verint-purple-deeper shadow-verint-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo — GXT mark + app name */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            {/* GXT circular logo */}
            <div className="relative w-10 h-10 flex-shrink-0 rounded-full overflow-hidden
                            ring-2 ring-white ring-opacity-20 group-hover:ring-opacity-50
                            transition-all shadow-md">
              <Image
                src="/gxt-logo.svg"
                alt="GXT Logo"
                fill
                sizes="40px"
                className="object-cover"
                priority
              />
            </div>

            {/* App name */}
            <div className="hidden sm:block">
              <div className="text-white font-bold text-base leading-tight tracking-wide">
                Verint FI Intel
              </div>
              <div className="text-verint-purple-pale text-xs leading-tight opacity-75">
                Financial Security Intelligence
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
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
          </div>

          {/* Auth section */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
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
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-verint-purple-pale hover:text-white text-sm font-medium transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-white text-verint-purple hover:bg-verint-purple-pale font-semibold
                             text-sm px-4 py-2 rounded-lg transition-colors shadow-md"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

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
          <div className="border-t border-verint-purple pt-3 mt-3 space-y-2">
            {user ? (
              <>
                <div className="text-verint-purple-pale text-xs px-4 truncate">{user.email}</div>
                <button
                  onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="block w-full text-left px-4 py-2.5 text-sm text-white bg-verint-purple rounded-lg"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm text-verint-purple-pale">
                  Log In
                </Link>
                <Link href="/auth/signup" onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm bg-white text-verint-purple
                             rounded-lg font-semibold text-center">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
