'use client'
// This needs to be a dedicated Client Component in order to use the super handy router.back() method, completely new to me!
// And we'll simply import this component into the Deatiled Page Server Component!

import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();

  return (
    <button 
      onClick={() => router.back()} // Will act identically to the browser's native back button!
      className="inline-block mb-8 text-[#5C613E] hover:text-[#2C302E] font-sans text-sm transition-colors cursor-pointer text-left"
    >
      ← Step back
    </button>
  );
}