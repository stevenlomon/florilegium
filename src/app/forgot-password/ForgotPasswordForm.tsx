'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch {
      setError('Something went wrong. Check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center">
        <div className="bg-[#424B2E]/5 border border-[#424B2E]/20 rounded-md p-6 mb-6">
          <p className="text-[#2C302E] font-serif text-sm leading-relaxed">
            If an account with that email exists, we&apos;ve sent a reset link.
            Check your inbox.
          </p>
        </div>
        <Link
          href="/login"
          className="text-[#424B2E] font-sans text-[10px] font-bold tracking-widest uppercase hover:underline underline-offset-4 decoration-[#424B2E]/30 hover:decoration-[#424B2E] transition-all"
        >
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {error && (
          <div className="bg-[#8C3A3A]/10 text-[#8C3A3A] p-4 rounded-md text-sm font-serif italic border border-[#8C3A3A]/20 animate-in fade-in duration-300">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E] ml-1" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-white/50 border border-[#E5E0D8] rounded-md px-4 py-2.5 font-serif text-sm text-[#2C302E] focus:outline-none focus:border-[#424B2E] focus:ring-1 focus:ring-[#424B2E] transition-all shadow-sm"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-4 bg-[#424B2E] text-[#FCF9F2] font-sans text-sm font-medium tracking-wide px-8 py-3 rounded-md hover:bg-[#343b24] transition shadow-sm disabled:opacity-70 disabled:cursor-wait"
        >
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <div className="mt-8 text-center border-t border-[#E5E0D8] pt-6">
        <p className="text-[#5C613E] font-serif text-sm">
          Remembered it?{' '}
          <Link href="/login" className="text-[#424B2E] font-sans text-[10px] font-bold tracking-widest uppercase hover:underline underline-offset-4 decoration-[#424B2E]/30 hover:decoration-[#424B2E] transition-all ml-1">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
