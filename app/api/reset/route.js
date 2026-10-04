import { NextResponse } from 'next/server';
import { resetDatabase } from '@/lib/db';
import { resetCache } from '@/lib/apify';

export async function POST() {
  try {
    // 1. Purge database records
    await resetDatabase();

    // 2. Invalidate 24-hour cache lock so next call forces new data
    resetCache();

    return NextResponse.json({
      success: true,
      message: 'System and database completely reset. Cache shields invalidated.'
    });
  } catch (err) {
    console.error('[RESET] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
