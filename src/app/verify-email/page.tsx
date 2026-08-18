import Link from 'next/link';
import { pool } from '@/lib/db';
import { validateToken, markTokenUsed } from '@/lib/tokens';

export const metadata = {
  title: "Verify Email | Florilegium",
  description: "Verify your Florilegium email address",
};

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  let status: 'success' | 'error' = 'error';
  let errorMessage = 'No verification token found.';

  if (token) {
    const result = await validateToken(token, 'email_verify');

    if (result) {
      await pool.query(
        'UPDATE "User" SET email_verified = TRUE WHERE id = $1',
        [result.userId]
      );
      await markTokenUsed(result.tokenId);
      status = 'success';
      errorMessage = '';
    } else {
      errorMessage = 'Invalid or expired verification link. Please register again.';
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#FCF9F2] rounded-lg shadow-xl border border-[#E5E0D8] p-10 text-center">

        {status === 'success' ? (
          <>
            <h1 className="text-2xl font-heading text-[#2C302E] mb-2">Email verified!</h1>
            <p className="text-[#5C613E] font-serif italic text-sm mb-8">Your garden is ready. You can now log in.</p>
            <Link
              href="/login"
              className="inline-block bg-[#424B2E] text-[#FCF9F2] font-sans text-sm font-medium tracking-wide px-8 py-3 rounded-md hover:bg-[#343b24] transition shadow-sm"
            >
              Log In
            </Link>
          </>
        ) : (
          <>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[#EFEBE1] border border-[#E5E0D8] mb-6 shadow-sm">
              <span className="text-xl">🍂</span>
            </div>
            <h1 className="text-2xl font-heading text-[#2C302E] mb-2">Verification failed</h1>
            <p className="text-[#5C613E] font-serif italic text-sm mb-8">{errorMessage}</p>
            <Link
              href="/register"
              className="inline-block bg-[#424B2E] text-[#FCF9F2] font-sans text-sm font-medium tracking-wide px-8 py-3 rounded-md hover:bg-[#343b24] transition shadow-sm"
            >
              Try Again
            </Link>
          </>
        )}

      </div>
    </div>
  );
}
