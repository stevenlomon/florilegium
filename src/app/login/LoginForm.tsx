'use client'; // The only user interactive part of the Login Page. Needs to use `useState` and this it needs 'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // We use state variables for these rather than Loading.tsx and Error.tsx since we're dealing with form submissions. I will deep dive into this after the prototype is built
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success === "ok") {
        // Clear out the stale client-side router cache. Without this, the client-side router could think the now logged-in user is still an unauthenticated guest!
        router.refresh();

        // Navigate safely to the profile page
        router.push('/profile');
      } else {
        setError("Invalid username or password. Please try again."); // Security best practice: never give away which one is incorrect to any potential malicious user
      }
    } catch (err) {
      console.error("Unexpected login fetch error:", err);
      setError("Something went wrong. Check your connection and try again in a few moments.");
    } finally {
      setIsLoading(false);
    }
  };

  // Placeholder CSS, to be properly styled when I have a clear sense of the design of the app
  // "when I have a clear sense of the design of the app" Once again; now I do haha!
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="mt-4 bg-[#424B2E] text-[#FCF9F2] font-sans text-sm font-medium tracking-wide px-8 py-3 rounded-md hover:bg-[#343b24] transition shadow-sm disabled:opacity-70 disabled:cursor-wait"
        >
          {isLoading ? "Consulting archives..." : "Log In"}
        </button>
      </form>

      {/* Registration Link Stub */}
      <div className="mt-8 text-center border-t border-[#E5E0D8] pt-6">
        <p className="text-[#5C613E] font-serif text-sm">
          Don't have an account?{' '}
          <Link href="/register" className="text-[#424B2E] font-sans text-[10px] font-bold tracking-widest uppercase hover:underline underline-offset-4 decoration-[#424B2E]/30 hover:decoration-[#424B2E] transition-all ml-1">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
};
