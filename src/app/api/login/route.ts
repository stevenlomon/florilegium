import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const query1 = {
      name: 'fetch-username-match',
      text: 'SELECT * FROM "User" WHERE username = $1',
      values: [body.username],
    }
    const resp1 = await pool.query(query1);
    const user = resp1.rows[0];

    console.log("Login username match:", user.id);
    // Return early here if there is no match
    if (!user) {
      return NextResponse.json({
        success: "not ok"
      },
        { status: 401 }
      );
    }

    // Now that we have a username match, we check if the password match
    const query2 = {
      name: 'fetch-hashed-password',
      text: 'SELECT hashed_password FROM "Auth" WHERE user_id = $1',
      values: [user.id]
    }

    const resp2 = await pool.query(query2);
    const hashedPassword = resp2.rows[0].hashed_password;
    console.log("Hashed password:", hashedPassword);

    if (await bcrypt.compare(body.password, hashedPassword)) {
      // Initiate the session. I'm gonna dig up jwt knowledge from my Python days and deep layers of my memory here!
    }

  } catch (err) {
    console.error("Unexpected error when trying to login", err);
    return NextResponse.json({ success: "not ok" }, { status: 500 });
  }
}
