// The Profile Page is a Server component! No `useEffect` and no `useState`! All handled on the server by the server
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import HorizonSection from '@/components/profile/HorizonSection';
import { getHorizonBooks } from '@/lib/db/horizon';

export default async function ProfilePage() {
  // The Server Side user check, which runs before the browser even sees the page! 
  const user = await getCurrentUser();

  // If no JWT cookie exists, gracefully redirect them to the login page
  if (!user) {
    redirect('/login');
  }

  // We use the "Server seeds the client" pattern here now too!
  const initialHorizonBooks = await getHorizonBooks();

  // The rendering. All of this HTML will arrive in the browser fully baked with data!
  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto">
      <header className="mb-12 border-b border-[#E5E0D8] pb-6">
        <h1 className="text-4xl font-heading font-normal text-[#2C302E]">
          Welcome back, {user.username}.
        </h1>
        <p className="text-[#5C613E] mt-2 italic font-serif">
          This will say something neat later
        </p>
      </header>

      {/* The Horizon Section. Now a modular Client Component. And now also seeded by the server! */}
      < HorizonSection initialBooks={initialHorizonBooks} />
    </div>
  );
}
