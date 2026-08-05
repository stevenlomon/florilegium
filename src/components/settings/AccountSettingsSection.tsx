'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AccountDetailsSectionProps {
  initialUsername: string;
  initialFirstName: string;
  memberSince: string;
}

export default function AccountDetailsSection({ initialUsername, initialFirstName, memberSince }: AccountDetailsSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(initialUsername);
  const [firstName, setFirstName] = useState(initialFirstName);
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  
  const router = useRouter();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Front-end Guardrails
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }
    if (firstName.trim().length === 0) {
      setError("Display name cannot be empty.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username.trim(), 
          first_name: firstName.trim() 
        })
      });
      
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update profile.");
        setIsSaving(false);
        return;
      }

      setIsEditing(false);
      // The Magic Refresh: Next.js re-fetches the Server Component in the background
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Revert changes back to the original server-provided props
    setUsername(initialUsername);
    setFirstName(initialFirstName);
    setError("");
    setIsEditing(false);
  };

  return (
    <div className="bg-white/50 border border-[#E5E0D8] rounded-md shadow-sm overflow-hidden transition-all duration-300">
      <form onSubmit={handleSave} className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        
        <div className="flex flex-wrap gap-x-12 gap-y-6 flex-1">
          {/* USERNAME */}
          <div className="flex flex-col">
            <label htmlFor="username" className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E] mb-1">
              Username
            </label>
            {isEditing ? (
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                className="bg-transparent border-b border-[#E5E0D8] focus:border-[#424B2E] outline-none py-1 font-heading text-2xl text-[#2C302E] transition-colors w-40"
              />
            ) : (
              <p className="font-heading text-2xl text-[#2C302E] py-1">{initialUsername}</p>
            )}
          </div>

          {/* DISPLAY NAME */}
          <div className="flex flex-col">
            <label htmlFor="firstName" className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E] mb-1">
              Display Name
            </label>
            {isEditing ? (
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-transparent border-b border-[#E5E0D8] focus:border-[#424B2E] outline-none py-1 font-heading text-2xl text-[#2C302E] transition-colors w-40"
              />
            ) : (
              <p className="font-heading text-2xl text-[#2C302E] py-1">{initialFirstName}</p>
            )}
          </div>

          {/* MEMBER SINCE (Static) */}
          <div className="flex flex-col">
            <p className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E] mb-1">
              Member Since
            </p>
            <p className="font-heading text-2xl text-[#2C302E] py-1">{memberSince}</p>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="shrink-0 flex items-center justify-end w-full md:w-auto mt-4 md:mt-0">
          {isEditing ? (
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="text-[#5C613E]/70 font-sans text-[10px] font-bold uppercase tracking-widest hover:text-[#5C613E] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="bg-[#424B2E] text-[#FCF9F2] px-4 py-2 rounded text-[10px] font-sans font-bold uppercase tracking-widest hover:bg-[#343b24] transition-colors shadow-sm disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          ) : (
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setIsEditing(true);
              }} 
              className="text-[#5C613E] font-sans text-[10px] font-bold uppercase tracking-widest hover:text-[#2C302E] transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      </form>
      
      {/* ERROR BANNER */}
      {error && (
        <div className="bg-[#8C3A3A]/5 border-t border-[#8C3A3A]/20 p-3 px-6 md:px-8 text-sm font-serif italic text-[#8C3A3A] animate-in fade-in duration-300">
          {error}
        </div>
      )}
    </div>
  )
};