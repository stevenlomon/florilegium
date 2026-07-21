// The Profile Page is a Server component! No `useEffect` and no `useState`! All handled on the server by the server
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import HorizonSection from '@/components/profile/HorizonSection';
import { getHorizonBooks } from '@/lib/db/horizon';
import WelcomeModal from '@/components/profile/WelcomeModal';

export default async function ProfilePage() {
  // The Server Side user check, which runs before the browser even sees the page! 
  const user = await getCurrentUser();

  // If no JWT cookie exists, gracefully redirect them to the login page
  if (!user) {
    redirect('/login');
  }

  // We use the "Server seeds the client" pattern here now too!
  const initialHorizonBooks = await getHorizonBooks();

  // If first_name is null (or an empty string), they haven't been onboarded!
  const needsOnboarding = !user.first_name;

  // The rendering. All of this HTML will arrive in the browser fully baked with data!
  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto relative">

      {/* Conditionally render the onboarding overlay */}
      {needsOnboarding && <WelcomeModal />}

      <header className="mb-12 border-b border-[#E5E0D8] pb-6">
        <h1 className="text-4xl font-heading font-normal text-[#2C302E]">
          {/* Now uses first_name rather than username! */}
          Welcome back, {user.first_name}.
        </h1>
        <p className="text-[#5C613E] mt-2 italic font-serif">
          This will say something neat later
        </p>
      </header>

      {/* The Horizon Section. Now a modular Client Component. And now also seeded by the server! */}
      < HorizonSection initialBooks={initialHorizonBooks} />
    </div>
  )
};