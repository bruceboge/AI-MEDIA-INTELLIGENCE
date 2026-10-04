import { NextResponse } from 'next/server';
import { getCachedArticles, searchLiveNews } from '@/lib/rss';
import { classifyBatch } from '@/lib/classifier';
import { synthesizeIntelligence } from '@/lib/gemini';
import { getPosts } from '@/lib/apify';
import { createSession } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { query, category = 'all', customPrompt, userId } = await request.json();

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Search topic is required' }, { status: 400 });
    }

    const cleanQuery = query.trim();

    // 1. Session creation
    const { session } = await createSession(userId, cleanQuery, category);

    // 2. Dynamic live news search
    const rawLiveNews = await searchLiveNews(cleanQuery);
    const liveNews = rawLiveNews.map(a => ({
      ...a,
      sourceType: 'rss',
      sourceLabel: 'Live News Outlet'
    }));

    const cachedNews = getCachedArticles(150)
      .map(a => ({ ...a, sourceType: 'rss', sourceLabel: 'News Outlet' }))
      .filter(a => `${a.title || ''} ${a.summary || ''}`.toLowerCase().includes(cleanQuery.toLowerCase()));

    // 3. Social posts search from 33+ monitored figures
    const socialPosts = getPosts('All', 'All', 50)
      .map(p => ({ ...p, sourceType: 'social_x', sourceLabel: '𝕏 Key Figure (Apify)' }))
      .filter(p => {
        const textToSearch = `${p.title || ''} ${p.summary || ''} ${p.authorName || ''} ${p.authorHandle || ''} ${p.topic || ''}`.toLowerCase();
        return textToSearch.includes(cleanQuery.toLowerCase());
      });

    // 4. Fast sub-5ms Pre-Classifier
    const combined = [...liveNews, ...cachedNews, ...socialPosts];
    const { categorized, counts } = classifyBatch(combined);

    const targetSet = category !== 'all' && categorized[category] && categorized[category].length > 0
      ? categorized[category]
      : (combined.length > 0 ? combined.slice(0, 35) : getCachedArticles(20));

    // 5. Deep LLM Synthesis with Gemini
    const report = await synthesizeIntelligence(targetSet, customPrompt);

    return NextResponse.json({
      success: true,
      sessionId: session ? session.id : 'sess_local',
      query: cleanQuery,
      category,
      totalHarvested: combined.length,
      newsCount: liveNews.length + cachedNews.length,
      socialCount: socialPosts.length,
      counts,
      items: targetSet,
      report
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
