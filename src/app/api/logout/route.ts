import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // "Logging out" simply means... destroying the session cookie!
    (await cookies()).delete('florilegium-session');

    return NextResponse.json({ success: "ok" });
  } catch (error) {
    console.error("Unexpected error during logout:", error);
    return NextResponse.json({ success: "not ok" }, { status: 500 });
  }
};