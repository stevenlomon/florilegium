// The Profile Page is a Server component! No `useEffect` and no `useState`! All handled on the server by the server
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import HorizonSection from '@/components/profile/HorizonSection';
import { getHorizonBooks } from '@/lib/db/horizon';
import WelcomeModal from '@/components/profile/WelcomeModal';

// We now accept searchParams to look for our secret onboarding flag!
export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ greet?: string }> }) {
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

  // Await the params and check if they just arrived from the onboarding modal
  const params = await searchParams;
  const isFirstEntry = params.greet === 'new';

  // The rendering. All of this HTML will arrive in the browser fully baked with data!
  return (
    <div className="min-h-screen max-w-7xl mx-auto px-8 py-12 relative">

      {/* Conditionally render the onboarding overlay */}
      {needsOnboarding && <WelcomeModal />}

      <header className="mb-12 border-b border-[#E5E0D8] pb-6">
        <h1 className="text-4xl font-heading font-normal text-[#2C302E]">
          {/* Dynamically drop the "back" if it's their very first time! */}
          Welcome{isFirstEntry ? '' : ' back'}, {user.first_name}.
        </h1>
      </header>

      {/* The Horizon Section. Now a modular Client Component. And now also seeded by the server! */}
      < HorizonSection initialBooks={initialHorizonBooks} />
    </div>
  )
};