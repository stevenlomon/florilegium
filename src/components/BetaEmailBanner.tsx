'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function BetaEmailBanner() {
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'checking' | 'idle' | 'loading' | 'success' | 'error' | 'hidden'>('checking');
  const [errorMessage, setErrorMessage] = useState('');

  const authPages = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password'];
  const isAuthPage = authPages.includes(pathname);

  useEffect(() => {
    if (isAuthPage) return;
    fetch('/api/users/status')
      .then(res => res.json())
      .then(data => {
        if (data.loggedIn && !data.hasEmail) {
          setStatus('idle');
        } else {
          setStatus('hidden');
        }
      })
      .catch(() => setStatus('hidden'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/users/email', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok && data.success === 'ok') {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Something went wrong.');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
    }
  };

  if (isAuthPage || status === 'checking' || status === 'hidden') return null;

  if (status === 'success') {
    return (
      <div className="mx-8 mt-6 bg-[#424B2E]/10 border border-[#424B2E]/20 rounded-md p-5">
        <p className="font-serif text-sm text-[#424B2E] italic">
          Verification email sent! Check your inbox and click the link to complete setup.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-8 mt-6 bg-[#EFEBE1] border border-[#E5E0D8] rounded-md p-5">
      <p className="font-heading text-base text-[#2C302E] mb-1">
        Hey, Beta tester! 🌱
      </p>
      <p className="font-serif text-sm text-[#5C613E] leading-relaxed mb-4">
        I wholeheartedly appreciate you being here from the start. Genuinely. Email verification is now live!
        Please take a moment to add yours so you can reset your password if you ever need to.
      </p>

      {status === 'error' && (
        <div className="bg-[#8C3A3A]/10 text-[#8C3A3A] p-3 rounded-md text-sm font-serif italic border border-[#8C3A3A]/20 mb-4">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-3 items-end">
        <div className="flex-1 flex flex-col gap-1">
          <label className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E] ml-1" htmlFor="beta-email">
            Email
          </label>
          <input
            id="beta-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full bg-white/50 border border-[#E5E0D8] rounded-md px-4 py-2.5 font-serif text-sm text-[#2C302E] focus:outline-none focus:border-[#424B2E] focus:ring-1 focus:ring-[#424B2E] transition-all shadow-sm"
          />
        </div>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="bg-[#424B2E] text-[#FCF9F2] font-sans text-xs font-medium tracking-wide px-5 py-2.5 rounded-md hover:bg-[#343b24] transition shadow-sm disabled:opacity-70 disabled:cursor-wait whitespace-nowrap"
        >
          {status === 'loading' ? 'Sending...' : 'Verify Email'}
        </button>
      </form>
    </div>
  );
}
