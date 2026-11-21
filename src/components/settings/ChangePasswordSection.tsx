'use client';

import { useState } from 'react';

export default function ChangePasswordSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCancel = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setError('');
    setSuccess('');
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError('All fields are required.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Password must contain at least one letter and one number.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to change password.');
        setIsSaving(false);
        return;
      }

      setSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

      setTimeout(() => {
        setSuccess('');
        setIsOpen(false);
      }, 2000);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 border-b border-[#E5E0D8]">
      {!isOpen ? (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="max-w-md">
            <p className="font-sans text-sm font-semibold text-[#2C302E]">Change Password</p>
            <p className="font-serif text-sm text-[#5C613E] italic mt-1 leading-relaxed">
              Update your account password. You&apos;ll need to enter your current password to confirm.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="text-[#5C613E] font-sans text-[10px] font-bold uppercase tracking-widest hover:text-[#2C302E] transition-colors shrink-0"
          >
            Change
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="max-w-md">
            <p className="font-sans text-sm font-semibold text-[#2C302E] mb-4">Change Password</p>

            <div className="space-y-4">
              <div className="flex flex-col">
                <label htmlFor="currentPassword" className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E] mb-1">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoFocus
                  className="bg-transparent border-b border-[#E5E0D8] focus:border-[#424B2E] outline-none py-1 font-sans text-sm text-[#2C302E] transition-colors"
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="newPassword" className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E] mb-1">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-transparent border-b border-[#E5E0D8] focus:border-[#424B2E] outline-none py-1 font-sans text-sm text-[#2C302E] transition-colors"
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="confirmNewPassword" className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E] mb-1">
                  Confirm New Password
                </label>
                <input
                  id="confirmNewPassword"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="bg-transparent border-b border-[#E5E0D8] focus:border-[#424B2E] outline-none py-1 font-sans text-sm text-[#2C302E] transition-colors"
                />
              </div>
            </div>

            <p className="font-serif text-xs text-[#5C613E]/70 italic mt-3">
              At least 8 characters, with at least one letter and one number.
            </p>
          </div>

          <div className="flex items-center justify-end gap-4 mt-6">
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
              {isSaving ? 'Saving...' : 'Update Password'}
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-[#8C3A3A]/5 border border-[#8C3A3A]/20 rounded p-3 text-sm font-serif italic text-[#8C3A3A]">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 bg-[#424B2E]/5 border border-[#424B2E]/20 rounded p-3 text-sm font-serif italic text-[#424B2E]">
              {success}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
