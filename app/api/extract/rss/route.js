import { NextResponse } from 'next/server';
import { getCachedArticles, fetchAllFeeds } from '@/lib/rss';
import { classifyBatch } from '@/lib/classifier';
import { saveExtractionSession } from '@/lib/db';

export async function POST() {
  try {
    // 1. Fetch live or cached RSS articles
    let articles = await fetchAllFeeds().catch(() => getCachedArticles(60));
    if (!articles || articles.length === 0) {
      articles = getCachedArticles(60);
    }

    // 2. Classify items
    const { categorized } = classifyBatch(articles);
    const enriched = Object.values(categorized).flat().map(a => ({
      ...a,
      sourceType: 'rss',
      sourceLabel: 'Verified Press (RSS)'
    }));

    // 3. Save to database with session metadata
    const result = await saveExtractionSession('rss', enriched, {
      trigger: 'manual_rss_button',
      outletsPolled: ['Daily Nation', 'The Standard', 'Citizen TV', 'The Star', 'Capital FM', 'KBC News']
    });

    return NextResponse.json({
      success: true,
      message: `Extracted ${result.itemsCount} RSS news articles and saved to database.`,
      session: result.session,
      items: result.items
    });
  } catch (err) {
    console.error('[EXTRACT_RSS] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
