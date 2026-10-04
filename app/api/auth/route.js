import { NextResponse } from 'next/server';
import { getStatus, signUp, signIn } from '@/lib/supabase';

export async function GET() {
  return NextResponse.json(getStatus());
}

export async function POST(request) {
  try {
    const { action, email, password, organizationName } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    if (action === 'signup') {
      const res = await signUp(email, password, organizationName);
      return NextResponse.json(res);
    }

    const res = await signIn(email, password);
    return NextResponse.json(res);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
