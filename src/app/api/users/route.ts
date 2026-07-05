import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  try {
    const userId = crypto.randomUUID();

    const body = await req.json(); // In Next.js, we don't need `app.use(express.json());`, JSON is the default! And this is how we grab the body
    const rawPassword = body.password; // This is now the direct equivalent of `const rawPassword = req.body.password;` from my Biscord code
    const username = body.username;

    const hashedPassword = await bcrypt.hash(rawPassword, 10); // Untouched from Biscord!

    // Unlike Biscord where we have auth_id in the User table, we now have user_id in the Auth table which is more pragmatic. We therefore need to create the User first, then the Auth entry

    // First query for the User row. We handle id and username server-side, our Postgre DB handles created_at and sets first_name as a default NULL
    const result1 = await pool.query('INSERT INTO "User"(id, username) VALUES ($1, $2) RETURNING *', [userId, username]);
    console.log("User table insertion result", result1.rows[0]);

    // Now creating the Auth row with user_id as FK as the second entry
    const result2 = await pool.query('INSERT INTO "Auth"(user_id, hashed_password) VALUES($1, $2) RETURNING *', [userId, hashedPassword]); // Still using parameterized queries
    console.log("Auth table insertion result", result2.rows[0]);

    // `res.status(201).json({` is replaced with..
    return NextResponse.json({
      success: "ok",
      data: {
        id: userId,
        username: username,
        hashed_pw: hashedPassword,
      }
    },
      { status: 201 }
    );
  } catch (err) {
    console.error("Unexpected error when trying to create new User", err);
    return NextResponse.json({ success: "not ok" }, { status: 500 });
  }
};