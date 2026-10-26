import { NextResponse } from 'next/server';
import { searchLiveNews, getCachedArticles } from '@/lib/rss';
import { getPosts } from '@/lib/apify';
import { generateInvestigativeFeature } from '@/lib/journalism';
import { saveInvestigation, getInvestigation, listInvestigations } from '@/lib/investigationStore';

function enrichSourceMetadata(sourceName, link, pubDate, title, summary) {
  const s = (sourceName || '').toLowerCase();

  let brand = {
    name: sourceName || 'Independent Press',
    icon: '📰',
    badgeColor: '#112747',
    textColor: '#ffffff',
    category: 'Print Media'
  };

  if (s.includes('nation')) {
    brand = { name: 'Daily Nation', icon: '📰', badgeColor: '#004b93', textColor: '#ffffff', category: 'National Broadsheet' };
  } else if (s.includes('standard')) {
    brand = { name: 'The Standard', icon: '📰', badgeColor: '#b91c1c', textColor: '#ffffff', category: 'National Broadsheet' };
  } else if (s.includes('citizen')) {
    brand = { name: 'Citizen Digital', icon: '📺', badgeColor: '#ea580c', textColor: '#ffffff', category: 'Broadcast News' };
  } else if (s.includes('capital')) {
    brand = { name: 'Capital FM', icon: '📻', badgeColor: '#7c3aed', textColor: '#ffffff', category: 'Radio & Wire' };
  } else if (s.includes('star')) {
    brand = { name: 'The Star Kenya', icon: '⭐', badgeColor: '#ca8a04', textColor: '#000000', category: 'Daily Newspaper' };
  } else if (s.includes('kbc')) {
    brand = { name: 'KBC News', icon: '📺', badgeColor: '#0284c7', textColor: '#ffffff', category: 'State Broadcaster' };
  } else if (s.includes('kenyans')) {
    brand = { name: 'Kenyans.co.ke', icon: '⚡', badgeColor: '#0f223d', textColor: '#e4a83b', category: 'Digital Native' };
  } else if (s.includes('twitter') || s.includes('x.com') || s.includes('@') || s.includes('social')) {
    brand = { name: sourceName || '𝕏 Intelligence', icon: '𝕏', badgeColor: '#000000', textColor: '#1d9bf0', category: 'Social Verification' };
  } else if (s.includes('google')) {
    brand = { name: 'Google News Wire', icon: '🌐', badgeColor: '#1e293b', textColor: '#38bdf8', category: 'Aggregated Wire' };
  }

  let formattedDate = 'Recent';
  try {
    if (pubDate) {
      formattedDate = new Date(pubDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  } catch (e) {}

  return {
    ...brand,
    link: link || '#',
    title: title || 'Breaking Report',
    summary: summary || '',
    pubDate: formattedDate
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'list') {
      const list = listInvestigations(20);
      return NextResponse.json({ success: true, investigations: list });
    }

    const id = searchParams.get('id') || 'latest';
    const item = getInvestigation(id);

    if (!item) {
      return NextResponse.json({ error: 'Investigation dossier not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      id: item.id,
      query: item.query,
      createdAt: item.createdAt,
      totalScrapedItems: item.totalScrapedItems,
      report: item.report,
      sources: item.sources
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { query } = await request.json();
    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Search topic is required' }, { status: 400 });
    }

    const cleanQuery = query.trim();

    // 1. Live Web Scraping: Scrape Google News RSS for live breaking stories on this topic
    const liveNews = await searchLiveNews(cleanQuery).catch(err => {
      console.warn('[INVESTIGATE_API] Live search notice:', err.message);
      return [];
    });

    // 2. Local RSS Cache: Filter existing monitored stories
    const cachedNews = getCachedArticles(150).filter(a =>
      `${a.title || ''} ${a.summary || ''}`.toLowerCase().includes(cleanQuery.toLowerCase())
    );

    // 3. Social Scraper: Filter tweets from the 33 monitored figures
    const socialPosts = getPosts('All', 'All', 50).filter(p =>
      `${p.title || ''} ${p.summary || ''} ${p.authorName || ''} ${p.authorHandle || ''}`.toLowerCase().includes(cleanQuery.toLowerCase())
    );

    // Combine all scraped sources and deduplicate by link or title
    const allScraped = [...liveNews, ...cachedNews, ...socialPosts];
    const uniqueMap = new Map();
    allScraped.forEach(item => {
      const key = item.link || item.title;
      if (!uniqueMap.has(key)) uniqueMap.set(key, item);
    });

    let dataset = Array.from(uniqueMap.values());

    // If zero direct matches found, fall back to top cached stories to ensure report still generates
    if (dataset.length === 0) {
      dataset = getCachedArticles(20);
    }

    // 4. Generate Newspaper-Grade Report via Dedicated Gemini Engine
    const report = await generateInvestigativeFeature(cleanQuery, dataset);

    // 5. Build Clickable Verified Sources Array with Icons & Direct Links
    const sources = dataset.slice(0, 16).map(item =>
      enrichSourceMetadata(
        item.sourceName || item.authorName,
        item.link,
        item.pubDate,
        item.title,
        item.summary
      )
    );

    // 6. Persist to dedicated investigation store
    const saved = saveInvestigation({
      query: cleanQuery,
      totalScrapedItems: dataset.length,
      report,
      sources
    });

    return NextResponse.json({
      success: true,
      id: saved.id,
      query: cleanQuery,
      createdAt: saved.createdAt,
      totalScrapedItems: dataset.length,
      report,
      sources
    });
  } catch (err) {
    console.error('[API_INVESTIGATE_ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
