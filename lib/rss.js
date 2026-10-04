/**
 * Multi-Outlet RSS Ingestion & Corroboration Engine (ES Module)
 */
import fs from 'fs';
import path from 'path';
import Parser from 'rss-parser';

const parser = new Parser({ timeout: 12000 });
const ARTICLES_FILE = path.join(process.cwd(), 'data', 'articles.json');

const KENYA_FEEDS = [
  { name: 'Google News Kenya', url: 'https://news.google.com/rss?hl=en-KE&gl=KE&ceid=KE:en' },
  { name: 'Capital FM Kenya', url: 'https://www.capitalfm.co.ke/news/feed/' },
  { name: 'The Star Kenya', url: 'https://www.the-star.co.ke/rss' },
  { name: 'KBC News', url: 'https://www.kbc.co.ke/feed/' },
  { name: 'Standard Media', url: 'https://www.standardmedia.co.ke/rss/headlines.php' }
];

export function getCachedArticles(limit = 100) {
  try {
    if (fs.existsSync(ARTICLES_FILE)) {
      const data = JSON.parse(fs.readFileSync(ARTICLES_FILE, 'utf8'));
      return Array.isArray(data) ? data.slice(0, limit) : [];
    }
  } catch (e) {}
  return [];
}

export async function fetchAllFeeds() {
  const allArticles = [];

  for (const feedConfig of KENYA_FEEDS) {
    try {
      const feed = await parser.parseURL(feedConfig.url);
      if (feed && Array.isArray(feed.items)) {
        feed.items.slice(0, 15).forEach((item, idx) => {
          allArticles.push({
            id: `rss_${Buffer.from(item.link || item.title || '').toString('base64').slice(0, 20)}_${idx}`,
            title: (item.title || 'Untitled').trim(),
            summary: (item.contentSnippet || item.content || item.summary || item.title || '').slice(0, 320).trim(),
            link: item.link || '',
            pubDate: item.pubDate || new Date().toISOString(),
            sourceName: (item.source && item.source._) ? item.source._ : feedConfig.name,
            sourceType: 'rss'
          });
        });
      }
    } catch (err) {
      console.warn(`[RSS] Failed parsing ${feedConfig.name}:`, err.message);
    }
  }

  if (allArticles.length === 0) {
    return getCachedArticles(60);
  }

  // Update articles.json cache
  try {
    fs.writeFileSync(ARTICLES_FILE, JSON.stringify(allArticles, null, 2), 'utf8');
  } catch (e) {}

  return allArticles;
}

export async function searchLiveNews(query) {
  if (!query) return [];
  const url = `https://news.google.com/rss/search?q=Kenya+${encodeURIComponent(query)}&hl=en-KE&gl=KE&ceid=KE:en`;
  try {
    const feed = await parser.parseURL(url);
    if (!feed || !feed.items) return [];

    return feed.items.slice(0, 30).map((item, idx) => ({
      id: `live_${Date.now()}_${idx}`,
      title: item.title || 'Untitled Report',
      summary: (item.contentSnippet || item.content || '').slice(0, 280),
      link: item.link,
      pubDate: item.pubDate || new Date().toISOString(),
      sourceName: (item.source && item.source._) ? item.source._ : 'Google News Kenya',
      sourceType: 'rss'
    }));
  } catch (err) {
    console.warn('[RSS] Live search fallback:', err.message);
    return [];
  }
}
