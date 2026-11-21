import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const STATUS_LABELS: Record<number, string> = {
  1: 'Intend to Read',
  2: 'Currently Reading',
  3: 'Read',
  4: 'Dropped',
};

// Helper function to handle comma, quotes and newlines in reviews and titles so that the CSV doesn't break in Excel
function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`; // Using the regex global flag to replace all instances, not just the first one
  }
  return value;
}

export async function GET() {
  // Code to be written here
}