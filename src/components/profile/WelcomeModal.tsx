'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WelcomeModal() {
  const [firstName, setFirstName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) return;

    setIsSaving(true);

    try {
      const res = await fetch('/api/users/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName })
      });

      if (!res.ok) throw new Error("Failed to save name");

      // "Magic refresh" strikes again! The server will see first_name is no longer null, and this modal will gracefully vanish from the DOM.
      setTimeout(() => {
        // We push a URL parameter so the server knows this is their very first time entering!
        router.push('/profile?greet=new');
      }, 1600); // 1600ms is me fine tuning like a madman haha! A lovely, gentle breath before landing on the Profile page

    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FCF9F2]/95 backdrop-blur-sm p-4 animate-in fade-in duration-700">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl p-10 md:p-12 border border-[#E5E0D8] relative text-center">
        
        <div className="mb-6 flex flex-col items-center">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#EFEBE1] border border-[#E5E0D8] mb-5 shadow-sm">
            <span className="text-xl">🌿</span>
          </div>
          <h1 className="font-heading text-3xl text-[#2C302E]">
            Welcome to your garden.
          </h1>
        </div>

        <p className="font-serif text-[#5C613E] text-base leading-relaxed mb-10 px-4">
          A quiet sanctuary to cultivate your reading life, free from algorithms, endless feeds, and arbitrary challenges.
        </p>

        <form onSubmit={handleSave} className="flex flex-col items-center w-full max-w-xs mx-auto gap-6">
          <div className="w-full">
            <label htmlFor="firstName" className="sr-only">What should we call you?</label>
            <input
              id="firstName"
              type="text"
              autoFocus
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="What should we call you?"
              className="w-full bg-transparent border-b-2 border-[#E5E0D8] focus:border-[#424B2E] outline-none py-2 text-center font-heading text-2xl text-[#2C302E] placeholder:text-[#5C613E]/40 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving || firstName.trim().length === 0}
            className="w-full bg-[#424B2E] text-[#FCF9F2] font-sans text-sm font-medium tracking-wide py-3 rounded-md hover:bg-[#343b24] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isSaving ? "Opening the gates..." : "Enter"}
          </button>
        </form>

      </div>
    </div>
  )
};