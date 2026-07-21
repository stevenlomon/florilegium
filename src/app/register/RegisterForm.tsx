'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();

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
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok || registerData.success !== "ok") {
        // If Postgres throws a unique constraint error on the username, we catch it here.
        setError("That username is already taken or invalid. Please try another.");
        setIsLoading(false);
        return;
      }

      // 3. Auto-Login the User
      const loginResponse = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const loginData = await loginResponse.json();

      if (loginResponse.ok && loginData.success === "ok") {
        router.refresh();
        router.push('/profile');
      } else {
        // Fallback just in case auto-login fails
        router.push('/login');
      }
      
    } catch (err) {
      console.error("Unexpected registration error:", err);
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

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