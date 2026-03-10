'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

type PageState = 'loading' | 'form' | 'success' | 'invalid';

export default function ResetPasswordPage() {
  const [pageState, setPageState] = useState<PageState>('loading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Supabase puts the recovery token in the URL hash.
    // Calling getSession() after page load lets Supabase parse it automatically.
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setPageState('form');
      } else {
        // Wait briefly for Supabase to process the hash from the email link
        setTimeout(async () => {
          const { data: { session: s2 } } = await supabase.auth.getSession();
          setPageState(s2 ? 'form' : 'invalid');
        }, 1500);
      }
    };
    checkSession();
  }, [supabase]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setPageState('success');
    setTimeout(() => router.push('/auth/login'), 3000);
  };

  return (
    <div className="min-h-screen bg-verint-gradient flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden ring-4 ring-white ring-opacity-30 shadow-xl">
              <Image src="/gxt-logo.svg" alt="GXT Logo" fill sizes="64px" className="object-cover" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white">Verint FI Intelligence</h1>
          <p className="text-verint-purple-pale text-sm mt-1">Set New Password</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">

          {/* Loading */}
          {pageState === 'loading' && (
            <div className="text-center py-6">
              <div className="w-8 h-8 border-4 border-verint-purple border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Verifying your reset link…</p>
            </div>
          )}

          {/* Invalid / expired link */}
          {pageState === 'invalid' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-verint-purple-dark mb-3">Link Expired or Invalid</h2>
              <p className="text-gray-500 text-sm mb-6">
                This password reset link has expired or already been used.
                Please request a new one.
              </p>
              <Link href="/auth/forgot-password" className="btn-primary inline-block px-6 py-2 text-sm">
                Request New Link
              </Link>
            </div>
          )}

          {/* Password form */}
          {pageState === 'form' && (
            <>
              <h2 className="text-xl font-bold text-verint-purple-dark mb-2">Set New Password</h2>
              <p className="text-gray-500 text-sm mb-6">Choose a strong password for your account.</p>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="password" className="form-label">New Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label htmlFor="confirm" className="form-label">Confirm Password</label>
                  <input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="form-input"
                    placeholder="Re-enter your new password"
                    required
                    autoComplete="new-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full text-center flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating…
                    </>
                  ) : 'Update Password'}
                </button>
              </form>
            </>
          )}

          {/* Success */}
          {pageState === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-verint-purple-dark mb-3">Password Updated!</h2>
              <p className="text-gray-500 text-sm">
                Your password has been changed. Redirecting you to sign in…
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
