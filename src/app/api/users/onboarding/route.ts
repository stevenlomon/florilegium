import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { first_name } = body;

    if (!first_name || first_name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const query = {
      name: 'update-user-first-name',
      text: 'UPDATE "User" SET first_name = $1 WHERE id = $2 RETURNING *',
      values: [first_name.trim(), user.id]
    };

    const res = await pool.query(query);

    if (res.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: "ok", data: res.rows[0] });

  } catch (err) {
    console.error("Unexpected error capturing first_name during user onboarding:", err);
    return NextResponse.json({ success: "not ok", error: (err as Error).message }, { status: 500 });
  }
};