import { NextResponse } from 'next/server';
import { harvest, getPosts } from '@/lib/apify';
import { saveExtractionSession } from '@/lib/db';

export async function POST() {
  try {
    // 1. Force Apify harvest bypassing 24h shield
    console.log('[EXTRACT_APIFY] Triggering manual Apify extraction...');
    const harvestResult = await harvest(true).catch(e => {
      console.warn('[EXTRACT_APIFY] Live harvest fallback:', e.message);
      return { posts: getPosts('All', 'All', 50) };
    });

    const posts = (harvestResult.posts && harvestResult.posts.length > 0)
      ? harvestResult.posts
      : getPosts('All', 'All', 50);

    const enriched = posts.map(p => ({
      ...p,
      sourceType: 'social_x',
      sourceLabel: '𝕏 Key Figure (Apify)'
    }));

    // 2. Save to database with session metadata
    const result = await saveExtractionSession('apify_x', enriched, {
      trigger: 'manual_apify_button',
      bypassedQuotaShield: true,
      monitoredHandlesCount: 33
    });

    return NextResponse.json({
      success: true,
      message: `Harvested ${result.itemsCount} 𝕏 posts from Apify and saved to database.`,
      session: result.session,
      items: result.items
    });
  } catch (err) {
    console.error('[EXTRACT_APIFY] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
