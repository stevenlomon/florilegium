// The Profile Page is a Server component! No `useEffect` and no `useState`! All handled on the server by the server
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import HorizonSection from '@/components/HorizonSection';

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
      <header className="mb-12 border-b border-[#E5E0D8] pb-6">
        <h1 className="text-4xl font-heading font-normal text-[#2C302E]">
          Welcome back, {user.username}.
        </h1>
        <p className="text-[#5C613E] mt-2 italic font-serif">
          This will say something neat later
        </p>
      </header>

      {/* The Horizon Section. Now a modular Client Component */}
      < HorizonSection />
    </div>
  );
}
