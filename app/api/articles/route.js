import { NextResponse } from 'next/server';
import { getIntelligenceItems, saveExtractionSession } from '@/lib/db';
import { getCachedArticles } from '@/lib/rss';
import { getPosts } from '@/lib/apify';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get('topic');
  const source = searchParams.get('source') || 'all'; // 'all', 'rss', 'social_x'
  const limit = parseInt(searchParams.get('limit') || '80', 10);

  // 1. Read directly from Database
  let dbItems = await getIntelligenceItems({
    sourceType: source === 'all' ? null : source,
    category: topic && topic !== 'general' && topic !== 'all' ? topic : null,
    limit
  });

  // 2. If database has no items yet, automatically seed initial extraction into database
  if (!dbItems || dbItems.length === 0) {
    const rawRss = getCachedArticles(60).map(a => ({ ...a, sourceType: 'rss' }));
    const rawSocial = getPosts('All', 'All', 40).map(p => ({ ...p, sourceType: 'social_x' }));
    await saveExtractionSession('initial_seed', [...rawRss, ...rawSocial], { note: 'Initial Database Seed' });

    dbItems = await getIntelligenceItems({
      sourceType: source === 'all' ? null : source,
      category: topic && topic !== 'general' && topic !== 'all' ? topic : null,
      limit
    });
  }

  // 3. Format items cleanly for the client
  const formatted = (dbItems || []).map(i => ({
    id: i.id,
    sessionId: i.session_id,
    sourceType: i.source_type,
    sourceName: i.source_name,
    authorHandle: i.author_handle,
    authorName: i.author_name,
    title: i.title,
    summary: i.summary,
    link: i.link,
    category: i.category,
    topic: i.topic,
    tensionRisk: i.risk_level,
    metrics: i.metrics || {},
    pubDate: i.pub_date,
    scannedAt: i.scanned_at
  }));

  return NextResponse.json(formatted);
}
