import Link from 'next/link';
import { validateToken } from '@/lib/tokens';
import ResetPasswordForm from './ResetPasswordForm';

export const metadata = {
  title: "Reset Password | Florilegium",
  description: "Set a new password for your Florilegium account",
};

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  let isValid = false;
  if (token) {
    const result = await validateToken(token, 'password_reset');
    isValid = !!result;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#FCF9F2] rounded-lg shadow-xl border border-[#E5E0D8] p-10 relative overflow-hidden">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[#EFEBE1] border border-[#E5E0D8] mb-6 shadow-sm">
            <span className="text-xl opacity-80">{isValid ? '🌿' : '🍂'}</span>
          </div>
          {isValid ? (
            <>
              <h1 className="text-3xl font-heading text-[#2C302E] mb-2">
                Set a new password
              </h1>
              <p className="text-[#5C613E] font-serif italic text-sm">
                Choose something you&apos;ll remember this time.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-heading text-[#2C302E] mb-2">
                Link expired
              </h1>
              <p className="text-[#5C613E] font-serif italic text-sm mb-8">
                {token ? 'This reset link has already been used or has expired.' : 'No reset token found.'}
              </p>
              <Link
                href="/forgot-password"
                className="inline-block bg-[#424B2E] text-[#FCF9F2] font-sans text-sm font-medium tracking-wide px-8 py-3 rounded-md hover:bg-[#343b24] transition shadow-sm"
              >
                Request New Link
              </Link>
            </>
          )}
        </div>

        {isValid && <ResetPasswordForm />}

      </div>
    </div>
  );
}
