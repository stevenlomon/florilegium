// Login Page is a Server Component that imports the Login Page Form which is a Client Component and the only interactive part of the page!
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import LoginForm from './LoginForm';

// Clean, static SEO metadata (which is only possible in Server Components)
export const metadata = {
  title: "Log In | Florilegium",
  description: "Access your Florilegium account",
};

export default async function LoginPage() {
  // Check if the user is already logged in before rendering anything
  const user = await getCurrentUser();

  // Gracefully redirect them to the Profile Page if they already have a JWT cookie set
  if (user) {
    redirect('/profile');
  }

  // Render the static shell wrapper and mount the interactive form inside it (to be properly styled later when I have a clearer picture of the design)
  // I love that past comment. 2 weeks ago. What a journey so far! And so much to look forward to on the future horizon too! I do have a *MUCH* clearer
  // picture of the design now haha!
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#FCF9F2] rounded-lg shadow-xl border border-[#E5E0D8] p-10 relative overflow-hidden">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[#EFEBE1] border border-[#E5E0D8] mb-6 shadow-sm">
            <span className="text-xl opacity-80">🌿</span>
          </div>
          <h1 className="text-3xl font-heading text-[#2C302E] mb-2">
            Welcome back.
          </h1>
          <p className="text-[#5C613E] font-serif italic text-sm">
            Enter your credentials to access your garden.
          </p>
        </div>

        {/* Our user interactive Client Component */}
        <LoginForm />

      </div>
    </div>
  )
};