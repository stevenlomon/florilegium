import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { validateToken, markTokenUsed } from '@/lib/tokens';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const result = await validateToken(token, 'email_verify');

    if (!result) {
      return NextResponse.json(
        { error: 'Invalid or expired verification link. Please request a new one.' },
        { status: 400 }
      );
    }

    await pool.query(
      'UPDATE "User" SET email_verified = TRUE WHERE id = $1',
      [result.userId]
    );

    await markTokenUsed(result.tokenId);

    return NextResponse.json({ success: 'ok' });
  } catch (err) {
    console.error('Email verification error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
