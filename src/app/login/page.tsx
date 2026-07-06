// Login Page is a Server Component that imports the Login Page Form which is a Client Component and the only interactive part of the page!
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import LoginForm from './LoginForm';

// Clean, static SEO metadata (which is only possible in Server Components)
export const metadata = {
  title: "Log In | Book Momentum",
  description: "Access your Book Momentum account",
};

export default async function LoginPage() {
  // Check if the user is already logged in before rendering anything
  const user = await getCurrentUser();

  // Gracefully redirect them to the Profile Page is they already have a JWT cookie set
  if (user) {
    redirect('/profile');
  }

  // Render the static shell wrapper and mount the interactive form inside it (to be properly styled later when I have a clearer picture of the design)
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white border border-slate-200 p-8 rounded-lg shadow-sm max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-6">
          Log In to Book Momentum
        </h1>
        
        {/* Our user interactive Client Component */}
        <LoginForm />
        
      </div>
    </main>
  )
};