import ForgotPasswordForm from './ForgotPasswordForm';

export const metadata = {
  title: "Forgot Password | Florilegium",
  description: "Reset your Florilegium password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#FCF9F2] rounded-lg shadow-xl border border-[#E5E0D8] p-10 relative overflow-hidden">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[#EFEBE1] border border-[#E5E0D8] mb-6 shadow-sm">
            <span className="text-xl opacity-80">🌿</span>
          </div>
          <h1 className="text-3xl font-heading text-[#2C302E] mb-2">
            Forgot your password?
          </h1>
          <p className="text-[#5C613E] font-serif italic text-sm">
            Enter the email tied to your account and we&apos;ll send a reset link.
          </p>
        </div>

        <ForgotPasswordForm />

      </div>
    </div>
  );
}
