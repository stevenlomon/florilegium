import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword, confirmNewPassword } = body;

    // The validation order is important and intentinonal here
    // Check fields exist -> match -> length -> complexity -> verify current password
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (newPassword !== confirmNewPassword) {
      return NextResponse.json({ error: 'New passwords do not match' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) { // Check one letter and one number using regex
      return NextResponse.json({ error: 'Password must contain at least one letter and one number' }, { status: 400 });
    }

    const authResult = await pool.query(
      'SELECT hashed_password FROM "Auth" WHERE user_id = $1',
      [user.id]
    );

    if (authResult.rows.length === 0) {
      return NextResponse.json({ error: 'Auth record not found' }, { status: 404 });
    }

    // Verifying the current password is intentionally last since it contains the expensive `bcrypt.compare` call
    const isMatch = await bcrypt.compare(currentPassword, authResult.rows[0].hashed_password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE "Auth" SET hashed_password = $1 WHERE user_id = $2',
      [hashedNewPassword, user.id]
    );

    return NextResponse.json({ success: 'ok' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}