'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import StateSelector from '@/components/StateSelector';

type Step = 'form' | 'success';

export default function SignupPage() {
  const [step, setStep] = useState<Step>('form');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    territory_states: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      setStep('success');
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-verint-gradient flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-black text-verint-purple-dark mb-3">Request Submitted!</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Your access request has been sent to the administrator at{' '}
              <strong>genxtalkin@gmail.com</strong>. You&#39;ll receive an email with your
              login credentials once your account is approved.
            </p>
            <div className="bg-verint-purple-bg rounded-xl p-4 text-sm text-verint-purple-dark mb-6">
              <strong>What happens next:</strong>
              <ol className="mt-2 space-y-1 text-left list-decimal list-inside">
                <li>Administrator reviews your request</li>
                <li>You receive an approval email with login credentials</li>
                <li>Log in and access your territory intelligence</li>
              </ol>
            </div>
            <Link href="/" className="btn-primary inline-block">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-verint-gradient flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden ring-4 ring-white ring-opacity-30 shadow-xl">
              <Image src="/gxt-logo.svg" alt="GXT Logo" fill sizes="64px" className="object-cover" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white">Verint FI Intelligence</h1>
          <p className="text-verint-purple-pale text-sm mt-1">Request access to the sales platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-verint-purple-dark mb-2">Request Access</h2>
          <p className="text-sm text-gray-500 mb-6">
            Complete the form below. An administrator will review and approve your account.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name row */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="form-label">First Name *</label>
                <input
                  id="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  className="form-input"
                  placeholder="Jane"
                  required
                />
              </div>
              <div>
                <label htmlFor="last_name" className="form-label">Last Name *</label>
                <input
                  id="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  className="form-input"
                  placeholder="Smith"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="form-label">Work Email Address *</label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="form-input"
                placeholder="jane.smith@verint.com"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="form-label">
                Mobile Phone
                <span className="ml-1 text-xs text-gray-400 font-normal">(for optional SMS alerts)</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="form-input"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            {/* Territory states */}
            <StateSelector
              selected={formData.territory_states}
              onChange={(states) =>
                setFormData((prev) => ({ ...prev, territory_states: states }))
              }
              label="Territory States (select states you cover)"
            />

            <button
              type="submit"
              disabled={loading || !formData.first_name || !formData.last_name || !formData.email}
              className="btn-primary w-full text-center flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : 'Submit Access Request'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-verint-purple-pale text-center text-sm">
            <p className="text-gray-500">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-verint-purple font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>

          <div className="mt-3 text-center">
            <Link href="/" className="text-xs text-gray-400 hover:text-verint-purple transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
