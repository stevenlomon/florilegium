// The Profile Page is a Server component! No `useEffect` and no `useState`! All handled on the server by the server
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function ProfilePage() {
  // The Server Side user check, which runs before the browser even sees the page! 
  const user = await getCurrentUser();

  // If no JWT cookie exists, gracefully redirect them to the login page (to be built next)
  if (!user) {
    redirect('/login');
  }

  // The rendering. All of this HTML will arrive in the browser fully baked with data! (dummy rendering with dummy CSS for now)
  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto">
      <header className="mb-8 border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold">Welcome back, {user.username}!</h1>
        <p className="text-gray-500 mt-2">Let's check in on your reading momentum.</p>
      </header>

      {/* Scaffolding for your upcoming features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <section className="bg-slate-50 border border-slate-200 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-slate-800">5 Horizon</h2>
          <p className="text-slate-600 mb-4">
            The 5 books you are most excited to read next.
          </p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            + Add to Horizon
          </button>
        </section>

        <section className="bg-slate-50 border border-slate-200 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-slate-800">My Bookshelf</h2>
          <p className="text-slate-600 mb-4">
            Your reading history, current reads, and statistics.
          </p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            View Full Bookshelf
          </button>
        </section>

      </div>
    </div>
  )
}
