import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import RegisterForm from './RegisterForm';

export const metadata = {
  title: "Register | Florilegium",
  description: "Join the digital renaissance book garden",
};

export default async function RegisterPage() {
  // Check if the user is already logged in before rendering anything
  const user = await getCurrentUser();

  // Gracefully redirect them to the Profile Page if they already have a JWT cookie set
  if (user) {
    redirect('/profile');
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#FCF9F2] rounded-lg shadow-xl border border-[#E5E0D8] p-10 relative overflow-hidden">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[#EFEBE1] border border-[#E5E0D8] mb-6 shadow-sm">
            <span className="text-xl opacity-80">🌱</span>
          </div>
          <h1 className="text-3xl font-heading text-[#2C302E] mb-2">
            Start growing your garden
          </h1>
          <p className="text-[#5C613E] font-serif italic text-sm">
            Create an account to start tracking your reading journey.
          </p>
        </div>

        {/* Our user interactive Client Component */}
        <RegisterForm />

      </div>
    </div>
  )
};