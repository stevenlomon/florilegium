import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  // Code to be written here
}