import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || 'Steven - Florilegium <no-reply@florilegium.page>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function sendVerificationEmail(email: string, token: string, username: string) {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Verify your Florilegium account',
    html: `
      <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; color: #2C302E;">
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="font-size: 32px;">🌿</span>
          <h1 style="font-family: Georgia, serif; font-size: 24px; color: #2C302E; margin: 16px 0 8px;">
            Welcome to the garden, ${username}.
          </h1>
          <p style="color: #5C613E; font-style: italic; font-size: 14px; margin: 0;">
            One small step before you can start growing.
          </p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${verifyUrl}"
             style="display: inline-block; background-color: #424B2E; color: #FCF9F2; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-family: sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.5px;">
            Verify Email
          </a>
        </div>

        <p style="color: #5C613E; font-size: 13px; text-align: center; line-height: 1.6;">
          This link expires in 24 hours.<br/>
          If you didn&rsquo;t create a Florilegium account, you can safely ignore this.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string, username: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Reset your Florilegium password',
    html: `
      <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; color: #2C302E;">
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="font-size: 32px;">🌿</span>
          <h1 style="font-family: Georgia, serif; font-size: 24px; color: #2C302E; margin: 16px 0 8px;">
            Password reset, ${username}.
          </h1>
          <p style="color: #5C613E; font-style: italic; font-size: 14px; margin: 0;">
            It happens to the best of us.
          </p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}"
             style="display: inline-block; background-color: #424B2E; color: #FCF9F2; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-family: sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.5px;">
            Reset Password
          </a>
        </div>

        <p style="color: #5C613E; font-size: 13px; text-align: center; line-height: 1.6;">
          This link expires in 1 hour.<br/>
          If you didn&rsquo;t request this, you can safely ignore it. Your password won&rsquo;t change.
        </p>
      </div>
    `,
  });
}
