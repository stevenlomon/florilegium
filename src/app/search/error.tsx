'use client'; // Error boundaries must be Client Components

import { useEffect } from 'react';
import Link from 'next/link';

export default function SearchError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log the error securely on the client
    console.error("Search Archives Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 animate-in fade-in duration-300">
      <span className="text-4xl mb-4">🌧️</span>
      <h2 className="font-heading text-2xl text-[#2C302E] mb-2">
        The archives are currently unreachable.
      </h2>
      <p className="font-sans text-[#5C613E] text-center max-w-md mb-8">
        We encountered a temporary network issue while consulting the catalog for your query. 
      </p>
      
      <div className="flex gap-4">
        {/* The reset function tells Next.js to re-attempt rendering the Server Component */}
        <button
          onClick={() => reset()}
          className="px-6 py-2 bg-[#424B2E] text-[#FCF9F2] rounded-md font-sans text-sm hover:bg-[#2C302E] transition-colors shadow-sm"
        >
          Try again
        </button>
        <Link 
          href="/"
          className="px-6 py-2 border border-[#E5E0D8] text-[#5C613E] bg-white rounded-md font-sans text-sm hover:border-[#5C613E] hover:text-[#2C302E] transition-colors"
        >
          Return to Desk
        </Link>
      </div>
    </div>
  )
};