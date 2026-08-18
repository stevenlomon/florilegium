import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { createVerificationToken } from '@/lib/tokens';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const res = await pool.query(
      'SELECT id, username FROM "User" WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ success: 'ok' });
    }

    const user = res.rows[0];
    const token = await createVerificationToken(user.id, 'password_reset');
    await sendPasswordResetEmail(email, token, user.username);

    return NextResponse.json({ success: 'ok' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
