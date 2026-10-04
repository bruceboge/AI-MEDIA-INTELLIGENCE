import { NextResponse } from 'next/server';
import { getAccounts, getPosts, getCacheStatus, harvest } from '@/lib/apify';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'status';

  if (type === 'accounts') {
    return NextResponse.json(getAccounts());
  }

  if (type === 'posts') {
    const category = searchParams.get('category') || 'All';
    const risk = searchParams.get('risk') || 'All';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    return NextResponse.json(getPosts(category, risk, limit));
  }

  return NextResponse.json(getCacheStatus());
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await harvest(Boolean(body.force));
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
