import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createVerificationToken } from '@/lib/tokens';
import { sendVerificationEmail } from '@/lib/email';

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: "not ok" }, { status: 401 });
    }

    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: "not ok", error: "Email is required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: "not ok", error: "Invalid email format" }, { status: 400 });
    }

    const existing = await pool.query('SELECT id FROM "User" WHERE email = $1 AND id != $2', [email, user.id]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ success: "not ok", error: "This email is already in use" }, { status: 409 });
    }

    await pool.query(
      'UPDATE "User" SET email = $1, email_verified = FALSE WHERE id = $2',
      [email, user.id]
    );

    try {
      const token = await createVerificationToken(user.id, 'email_verify');
      await sendVerificationEmail(email, token, user.username);
    } catch (emailErr) {
      console.error("Failed to send verification email:", emailErr);
    }

    return NextResponse.json({ success: "ok" });
  } catch (err) {
    console.error("Error updating email:", err);
    return NextResponse.json({ success: "not ok", error: (err as Error).message }, { status: 500 });
  }
}
