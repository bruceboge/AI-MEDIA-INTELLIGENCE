import { NextResponse } from 'next/server';
import { getIntelligenceItems, getExtractionSessions } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'items';

    if (type === 'sessions') {
      const sessions = await getExtractionSessions(50);
      return NextResponse.json({ success: true, sessions });
    }

    const sourceType = searchParams.get('source') || 'all';
    const category = searchParams.get('category') || 'all';
    const sessionId = searchParams.get('sessionId') || null;
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const items = await getIntelligenceItems({
      sourceType,
      category,
      sessionId,
      search,
      limit
    });

    const allItems = await getIntelligenceItems({ limit: 500 });
    const rssCount = allItems.filter(i => i.source_type === 'rss').length;
    const socialCount = allItems.filter(i => i.source_type === 'social_x').length;

    return NextResponse.json({
      success: true,
      totalCount: allItems.length,
      rssCount,
      socialCount,
      items
    });
  } catch (err) {
    console.error('[DATABASE_API] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
