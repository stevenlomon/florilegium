'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await fetch('/api/logout', { method: 'POST' });
      
      if (res.ok) {
        // Clear the client router cache and force a hard navigation to the login screen
        router.refresh();
        router.push('/login');
      } else {
        throw new Error("Failed to logout");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to log out. Please try again.");
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="bg-[#8C3A3A] text-[#FCF9F2] font-sans text-sm font-medium tracking-wide px-8 py-2.5 rounded hover:bg-[#6b2b2b] transition shadow-sm disabled:opacity-70 disabled:cursor-wait"
    >
      {isLoggingOut ? "Logging out..." : "Log Out"}
    </button>
  )
};