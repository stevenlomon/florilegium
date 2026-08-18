'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="text-center">
        <div className="bg-[#8C3A3A]/10 border border-[#8C3A3A]/20 rounded-md p-6 mb-6">
          <p className="text-[#8C3A3A] font-serif italic text-sm">
            Invalid reset link. Please request a new one.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="inline-block bg-[#424B2E] text-[#FCF9F2] font-sans text-sm font-medium tracking-wide px-8 py-3 rounded-md hover:bg-[#343b24] transition shadow-sm"
        >
          Request New Link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please try again.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok && data.success === 'ok') {
        setSuccess(true);
      } else {
        setError(data.error || 'Reset failed. The link may have expired.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="bg-[#424B2E]/5 border border-[#424B2E]/20 rounded-md p-6 mb-6">
          <p className="text-[#2C302E] font-serif text-sm leading-relaxed">
            Your password has been reset. You can now log in with your new password.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-block bg-[#424B2E] text-[#FCF9F2] font-sans text-sm font-medium tracking-wide px-8 py-3 rounded-md hover:bg-[#343b24] transition shadow-sm"
        >
          Log In
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
          <label className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E] ml-1" htmlFor="password">
            New Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-white/50 border border-[#E5E0D8] rounded-md px-4 py-2.5 font-serif text-sm text-[#2C302E] focus:outline-none focus:border-[#424B2E] focus:ring-1 focus:ring-[#424B2E] transition-all shadow-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E] ml-1" htmlFor="confirmPassword">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full bg-white/50 border border-[#E5E0D8] rounded-md px-4 py-2.5 font-serif text-sm text-[#2C302E] focus:outline-none focus:border-[#424B2E] focus:ring-1 focus:ring-[#424B2E] transition-all shadow-sm"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-4 bg-[#424B2E] text-[#FCF9F2] font-sans text-sm font-medium tracking-wide px-8 py-3 rounded-md hover:bg-[#343b24] transition shadow-sm disabled:opacity-70 disabled:cursor-wait"
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}
