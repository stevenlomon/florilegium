import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import bcrypt from 'bcrypt';
import { validateToken, markTokenUsed } from '@/lib/tokens';

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const result = await validateToken(token, 'password_reset');

    if (!result) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link. Please request a new one.' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'UPDATE "Auth" SET hashed_password = $1 WHERE user_id = $2',
      [hashedPassword, result.userId]
    );

    await markTokenUsed(result.tokenId);

    return NextResponse.json({ success: 'ok' });
  } catch (err) {
    console.error('Password reset error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
