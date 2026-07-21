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
        router.refresh(); 
      }, 1600); // 1600ms is me fine tuning like a madman haha! A lovely, gentle breath before landing on the Profile page

    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FCF9F2]/95 backdrop-blur-sm p-4 animate-in fade-in duration-700">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl p-12 md:p-16 border border-[#E5E0D8] relative">
        <div className="text-center mb-10">
          <span className="text-4xl opacity-80 mb-4 block">🌿</span>
          <h1 className="font-heading text-4xl text-[#2C302E] leading-tight mb-4">
            Welcome to your garden
          </h1>
        </div>

        <div className="space-y-6 font-serif text-[#2C302E] text-lg leading-relaxed max-w-lg mx-auto text-center">
          <p>
            Florilegium is a sanctuary designed to help you rekindle and cultivate your love for reading. There are no algorithms here, no endless scrolling feeds, and no arbitrary reading challenges.
          </p>
          <p>
            To begin, we suggest adding a few books to your <strong>Horizon</strong>. These are the books you want to cultivate momentum towards. The books where it's not a question about <i>if</i> you're going to read them, but <i>when</i>. 
          </p>
          <p className="text-[#5C613E] italic text-base">
            (If you ever feel unsure of how to use your Reading Tracks, find things in your Bookshelf, or anything else, please consult the Help page in the sidebar, or simply send me a message.)
          </p>
        </div>

        <form onSubmit={handleSave} className="mt-12 flex flex-col items-center max-w-xs mx-auto gap-6">
          <div className="w-full flex flex-col items-center gap-2">
            <label htmlFor="firstName" className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E]">
              What should we call you?
            </label>
            <input
              id="firstName"
              type="text"
              autoFocus
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-transparent border-b-2 border-[#E5E0D8] focus:border-[#424B2E] outline-none py-2 text-center font-heading text-2xl text-[#2C302E] placeholder:text-[#5C613E]/40 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving || firstName.trim().length === 0}
            className="mt-4 bg-[#424B2E] text-[#FCF9F2] font-sans text-sm font-medium tracking-wide px-10 py-3 rounded hover:bg-[#343b24] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Entering..." : "Enter your garden"}
          </button>
        </form>

      </div>
    </div>
  )
};