import LogoutButton from '@/components/settings/LogoutButton';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic'; // Signals to Next.js that this page is server-rendered per request!

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Format the joined_at string into an elegant, readable date
  const memberSince = user.joined_at 
    ? new Date(user.joined_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown';

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-8 py-12">
      {/* HEADER */}
      <header className="mb-12 border-b border-[#E5E0D8] pb-6">
        <h1 className="text-4xl font-heading text-[#2C302E] mb-2">Settings</h1>
        <p className="text-[#5C613E] font-serif italic text-lg">
          Manage your sanctuary and reading preferences.
        </p>
      </header>

      <div className="max-w-3xl space-y-12">
        {/* SECTION 1: ACCOUNT DETAILS */}
        <section>
          <h2 className="font-sans text-xs font-bold tracking-widest uppercase text-[#5C613E] mb-4 pl-1">
            Account Details
          </h2>
          <div className="bg-white/50 border border-[#E5E0D8] rounded-md p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
            {/* Added flex-wrap and gap-y-6 so it stays responsive on mobile! */}
            <div className="flex flex-wrap gap-x-12 gap-y-6">
              <div>
                <p className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E] mb-1">
                  Username
                </p>
                <p className="font-heading text-2xl text-[#2C302E]">{user.username}</p>
              </div>
              <div>
                <p className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E] mb-1">
                  Display Name
                </p>
                <p className="font-heading text-2xl text-[#2C302E]">{user.first_name || 'Not set'}</p>
              </div>
              <div>
                <p className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E] mb-1">
                  Member Since
                </p>
                <p className="font-heading text-2xl text-[#2C302E]">{memberSince}</p>
              </div>
            </div>
            <button disabled className="text-[#5C613E]/50 font-sans text-[10px] font-bold uppercase tracking-widest cursor-not-allowed transition-colors shrink-0">
              Edit (Soon)
            </button>
          </div>
        </section>

        {/* SECTION 2: READING PREFERENCES */}
        <section>
          <h2 className="font-sans text-xs font-bold tracking-widest uppercase text-[#5C613E] mb-4 pl-1">
            Reading Preferences
          </h2>
          <div className="bg-white/50 border border-[#E5E0D8] rounded-md shadow-sm">
            <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 opacity-70">
              <div className="max-w-md">
                <p className="font-sans text-sm font-semibold text-[#2C302E]">Default Shelving Action</p>
                <p className="font-serif text-sm text-[#5C613E] italic mt-1 leading-relaxed">
                  Bypass the Crossroads modal when stepping away from a book and default to a specific action (e.g., always return to &quot;Intend to Read&quot;).
                </p>
              </div>
              <div className="bg-[#EFEBE1]/50 px-4 py-2 rounded border border-[#E5E0D8] text-[10px] font-sans font-bold text-[#5C613E] uppercase tracking-widest shrink-0">
                Coming Soon
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: DATA & SOVEREIGNTY */}
        <section>
          <h2 className="font-sans text-xs font-bold tracking-widest uppercase text-[#5C613E] mb-4 pl-1">
            Data & Sovereignty
          </h2>
          <div className="bg-white/50 border border-[#E5E0D8] rounded-md shadow-sm flex flex-col">
            
            <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#E5E0D8]">
              <div className="max-w-md">
                <p className="font-sans text-sm font-semibold text-[#2C302E]">Export Library</p>
                <p className="font-serif text-sm text-[#5C613E] italic mt-1 leading-relaxed">
                  Download your entire reading history, polished reviews, and raw thought logs as a portable CSV file.
                </p>
              </div>
              <button disabled className="text-[#5C613E]/50 font-sans text-[10px] font-bold uppercase tracking-widest cursor-not-allowed shrink-0">
                Export (Soon)
              </button>
            </div>
            
            <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="max-w-md">
                <p className="font-sans text-sm font-semibold text-[#8C3A3A]">Dismantle Account</p>
                <p className="font-serif text-sm text-[#5C613E] italic mt-1 leading-relaxed">
                  Permanently delete your garden and all associated data from our active databases. This action cannot be undone.
                </p>
              </div>
              <button disabled className="text-[#8C3A3A]/50 font-sans text-[10px] font-bold uppercase tracking-widest cursor-not-allowed shrink-0">
                Delete (Soon)
              </button>
            </div>

          </div>
        </section>

        {/* SECTION 4: LOGOUT */}
        <section className="pt-12 flex justify-start">
          <LogoutButton />
        </section>

      </div>
    </div>
  )
};