import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { sessionId } = await request.json().catch(() => ({}));
    await clearSession(sessionId);
    return NextResponse.json({ success: true, message: 'Session cleared.' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
