'use client' // Error boundaries must be Client Components

import { useEffect } from 'react';
import Link from 'next/link';

export default function BookError({ error, reset }: { error: Error & { digest?: string }, reset: () => void}) {
  useEffect(() => {
    // For maximum logging, we could connect to a 3rd party service here. Future Issue!
    console.error("Book Page Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-8 text-center">
      {/* Decorative Icon */}
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#EFEBE1] border border-[#E5E0D8] shadow-sm">
        <span className="text-2xl opacity-80">🌧️</span>
      </div>

      <h1 className="mb-4 text-5xl font-heading text-[#2C302E]">
        The Archives are Unreachable
      </h1>

      <p className="mb-10 max-w-md text-lg font-serif italic leading-relaxed text-[#5C613E]">
        We encountered a connection delay while consulting the Open Library archives. The servers might be resting or experiencing heavy traffic.
      </p>

      <div className="flex gap-4">
        {/* The reset function allows the user to re-attempt the fetch without a hard page reload */}
        <button
          onClick={() => reset()}
          className="rounded-md bg-[#424B2E] px-8 py-3 font-sans text-sm font-medium tracking-wide text-[#FCF9F2] shadow-sm transition hover:bg-[#343b24]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md bg-[#EFEBE1] px-8 py-3 font-sans text-sm font-medium tracking-wide text-[#2C302E] shadow-sm transition hover:bg-[#E5E0D8]"
        >
          Return to garden
        </Link>
      </div>
    </div>
  )
};