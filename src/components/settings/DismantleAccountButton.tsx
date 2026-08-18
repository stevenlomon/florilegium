'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DismantleAccountButton({ username }: { username: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');

    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' });
      const data = await res.json();

      if (res.ok && data.success === 'ok') {
        router.refresh();
        router.push('/login');
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
        setIsDeleting(false);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="text-[#8C3A3A] font-sans text-[10px] font-bold uppercase tracking-widest hover:text-[#6b2b2b] hover:underline underline-offset-4 decoration-[#8C3A3A]/30 hover:decoration-[#8C3A3A] transition shrink-0"
      >
        Delete
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C302E]/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#FCF9F2] rounded-lg shadow-2xl border border-[#E5E0D8] p-8 md:p-10 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[#8C3A3A]/10 border border-[#8C3A3A]/20 mb-6">
              <span className="text-xl">🍂</span>
            </div>

            <h2 className="text-2xl font-heading text-[#2C302E] mb-2">Dismantle your garden?</h2>
            <p className="text-[#5C613E] font-serif italic text-sm mb-6 leading-relaxed">
              This will permanently delete your account, your entire bookshelf, all reading journeys, log posts, and reading tracks. This cannot be undone.
            </p>

            <p className="text-[#2C302E] font-sans text-xs mb-4">
              Type <strong>{username}</strong> to confirm.
            </p>

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={username}
              className="w-full bg-white/50 border border-[#E5E0D8] rounded-md px-4 py-2.5 font-serif text-sm text-[#2C302E] focus:outline-none focus:border-[#8C3A3A] focus:ring-1 focus:ring-[#8C3A3A] transition-all shadow-sm mb-4"
            />

            {error && (
              <div className="bg-[#8C3A3A]/10 text-[#8C3A3A] p-3 rounded-md text-sm font-serif italic border border-[#8C3A3A]/20 mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowConfirm(false); setConfirmText(''); setError(''); }}
                disabled={isDeleting}
                className="flex-1 bg-[#EFEBE1] text-[#2C302E] font-sans text-sm font-medium tracking-wide py-3 rounded-md hover:bg-[#E5E0D8] transition shadow-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmText !== username || isDeleting}
                className="flex-1 bg-[#8C3A3A] text-[#FCF9F2] font-sans text-sm font-medium tracking-wide py-3 rounded-md hover:bg-[#6b2b2b] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Dismantling...' : 'Dismantle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
