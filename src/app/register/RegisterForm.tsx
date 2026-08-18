'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // 1. Front-end Validation Guardrails
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters long.");
      setIsLoading(false);
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      setIsLoading(false);
      return;
    }

    try {
      // 2. Create the User
      const registerResponse = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), email: email.trim(), password }),
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok || registerData.success !== "ok") {
        setError(registerData.error || "That username or email is already taken. Please try another.");
        setIsLoading(false);
        return;
      }

      setVerificationSent(true);
      
    } catch (err) {
      console.error("Unexpected registration error:", err);
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="text-center">
        <div className="bg-[#424B2E]/5 border border-[#424B2E]/20 rounded-md p-6 mb-6">
          <p className="text-[#2C302E] font-serif text-sm leading-relaxed">
            We&apos;ve sent a verification link to <strong className="font-sans text-xs">{email.trim()}</strong>.
            Check your inbox and click the link to activate your account.
          </p>
        </div>
        <p className="text-[#5C613E] font-serif italic text-xs">
          Once verified, you can log in with your username.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Error Banner */}
        {error && (
          <div className="bg-[#8C3A3A]/10 text-[#8C3A3A] p-4 rounded-md text-sm font-serif italic border border-[#8C3A3A]/20 animate-in fade-in duration-300">
            {error}
          </div>
        )}

        {/* Username Input */}
        <div className="flex flex-col gap-1">
          <label className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E] ml-1" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full bg-white/50 border border-[#E5E0D8] rounded-md px-4 py-2.5 font-serif text-sm text-[#2C302E] focus:outline-none focus:border-[#424B2E] focus:ring-1 focus:ring-[#424B2E] transition-all shadow-sm"
          />
        </div>

        {/* Email Input */}
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
          <span className="font-serif italic text-[11px] text-[#5C613E]/60 ml-1">For verification and password recovery only.</span>
        </div>

        {/* Password Input */}
        <div className="flex flex-col gap-1">
          <label className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E] ml-1" htmlFor="password">
            Password
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

        {/* Confirm Password Input */}
        <div className="flex flex-col gap-1">
          <label className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E] ml-1" htmlFor="confirmPassword">
            Confirm Password
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="mt-4 bg-[#424B2E] text-[#FCF9F2] font-sans text-sm font-medium tracking-wide px-8 py-3 rounded-md hover:bg-[#343b24] transition shadow-sm disabled:opacity-70 disabled:cursor-wait"
        >
          {isLoading ? "Creating account..." : "Register"}
        </button>
      </form>

      {/* Login Link */}
      <div className="mt-8 text-center border-t border-[#E5E0D8] pt-6">
        <p className="text-[#5C613E] font-serif text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-[#424B2E] font-sans text-[10px] font-bold tracking-widest uppercase hover:underline underline-offset-4 decoration-[#424B2E]/30 hover:decoration-[#424B2E] transition-all ml-1">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}