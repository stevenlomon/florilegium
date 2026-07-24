import { NextResponse } from 'next/server';
import { getEditionsForWork } from '@/lib/api';

// The secure middleman between the browser and Open Library. Once again; the browser never talks directly to Open Library! These routes 
// are the part of the code that uses the `api.ts` API functions
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workId = searchParams.get("workId");

  if (!workId) {
    return NextResponse.json({ error: "Missing workId" }, { status: 400 });
  }

  try {
    // Adding the Labor Illusion to respect the act of "searching the archives"
    await new Promise((resolve) => setTimeout(resolve, 1600));
    
    const editions = await getEditionsForWork(workId);
    return NextResponse.json({ success: "ok", data: editions });
  } catch (err) {
    console.error("Editions Route Handler Error:", err);
    return NextResponse.json({ error: "Failed to fetch editions" }, { status: 500 });
  }
};