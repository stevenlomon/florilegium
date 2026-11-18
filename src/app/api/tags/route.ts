import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { pool } from '@/lib/db';

// Full Tag CRUD
export async function GET() {
  // Code to be added
}

export async function POST() {
  // Code to be added
}

export async function DELETE() {
  // Code to be added
}

// We don't want to rely on DELETE only for renaming tags. Without the PATCH route, a user would have to delete the 
// tag they wish to rename, which would sever all ties to bookshelf items, re-create it with the new name, and then
// re-assign all bookshelf items. Really, really bad UX
export async function PATCH() {
  // Code to be added
}