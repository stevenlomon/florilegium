import { NextResponse } from 'next/server';
import { getEditionsForWork } from '@/lib/api';
import { type Edition } from '@/lib/types';

// Our "Desk Cache". This `Map` holds previously fetched editions from this sessions in server memory. 
// This is what we need for "adaptive flexible Labor illusions"!
const deskCache = new Map<string, Edition[]>();

// The secure middleman between the browser and Open Library. Once again; the browser never talks directly to Open Library! These routes 
// are the part of the code that uses the `api.ts` API functions
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workId = searchParams.get("workId");

  if (!workId) {
    return NextResponse.json({ error: "Missing workId" }, { status: 400 });
  }

  try {
    // We *don't* immediately jump "blindly" to the Labor Illusion delay! 
    // We see if the user has already requested this resources already in this current session!
    if (deskCache.has(workId)) {
      return NextResponse.json({ success: "ok", data: deskCache.get(workId) });
    }

    // *Otherwise*, we add the Labor Illusion to respect the act of "searching the archives"
    await new Promise((resolve) => setTimeout(resolve, 1600));
    
    const editions = await getEditionsForWork(workId);

    // And here before returning, we update our current session "Desk Cache" memory with the resource!
    deskCache.set(workId, editions);

    // We also index every individual edition in this list
    for (const ed of editions) {
      if (ed.id) {
        deskCache.set(ed.id, editions);
      }
    }

    return NextResponse.json({ success: "ok", data: editions });
  } catch (error) {
    console.error("Editions Route Handler Error:", error);
    return NextResponse.json({ error: "Failed to fetch editions" }, { status: 500 });
  }
};