import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    await pool.query('DELETE FROM "Reading_Log_Post" WHERE user_id = $1', [userId]);

    await pool.query(
      `DELETE FROM "Recommendation_Context_Row"
       WHERE bookshelf_item_id IN (SELECT id FROM "Bookshelf_Item" WHERE user_id = $1)`,
      [userId]
    );

    await pool.query(
      `DELETE FROM "Reading_Journey"
       WHERE bookshelf_item_id IN (SELECT id FROM "Bookshelf_Item" WHERE user_id = $1)`,
      [userId]
    );

    await pool.query('DELETE FROM "Bookshelf_Item" WHERE user_id = $1', [userId]);

    await pool.query('DELETE FROM "Reading_Track" WHERE user_id = $1', [userId]);

    await pool.query('DELETE FROM "Verification_Token" WHERE user_id = $1', [userId]);

    await pool.query('DELETE FROM "Auth" WHERE user_id = $1', [userId]);

    await pool.query('DELETE FROM "User" WHERE id = $1', [userId]);

    (await cookies()).delete('florilegium-session');

    return NextResponse.json({ success: 'ok' });
  } catch (err) {
    console.error('Account deletion error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
