/**
 * Algorithmic Trend & Hashtag Extraction Engine
 * Scans ingested headlines, summaries, and social posts across all sources
 * to detect high-frequency topics, explicit hashtags, and emerging Kenyan entities.
 */

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'up', 'about', 'into', 'over', 'after', 'beneath', 'under', 'above',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
  'did', 'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'can', 'could',
  'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their', 'we', 'us',
  'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'what', 'which', 'who', 'whom',
  'whose', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
  'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  'says', 'said', 'want', 'wants', 'plan', 'plans', 'face', 'faces', 'call', 'calls',
  'seek', 'seeks', 'amid', 'ahead', 'report', 'reports', 'news', 'update', 'updates',
  'kenya', 'kenyan', 'nairobi', 'watch', 'video', 'photos', 'exclusive', 'breaking',
  'party', 'state', 'first', 'final', 'high', 'last', 'next', 'many', 'back', 'well',
  'the-star.co.ke', 'standardmedia.co.ke', 'capitalfm.co.ke', 'kbc.co.ke', 'daily nation'
]);

const CURATED_TOPICS = [
  { tag: '#Opposition', label: 'Opposition & Azimio', terms: ['opposition', 'azimio', 'odm', 'sifuna', 'raila', 'equitable party'] },
  { tag: '#2027Polls', label: '2027 Elections & Succession', terms: ['2027', '2027 polls', 'election', 'elections', 'polls', 'iebc', 'succession'] },
  { tag: '#Ruto', label: 'President William Ruto', terms: ['ruto', 'william ruto', 'state house'] },
  { tag: '#SecurityAlert', label: 'Security & Police Operations', terms: ['security', 'banditry', 'police', 'dci', 'crime', 'clash', 'arrest', 'ipoa'] },
  { tag: '#Judiciary', label: 'Judiciary & Court Rulings', terms: ['court', 'courts', 'judiciary', 'chief justice', 'high court', 'supreme court', 'backlogs'] },
  { tag: '#Gachagua', label: 'Rigathi Gachagua', terms: ['gachagua', 'rigathi', 'dp gachagua'] },
  { tag: '#Uhuru', label: 'Uhuru Kenyatta', terms: ['uhuru', 'uhuru kenyatta', 'jubilee'] },
  { tag: '#HealthSystem', label: 'Healthcare & SHA Delivery', terms: ['health system', 'health', 'sha', 'nhif', 'kmpdu', 'hospital', 'doctors', 'cancers'] },
  { tag: '#KeNHA', label: 'KeNHA & Infrastructure', terms: ['kenha', 'highways authority', 'swiss contractor'] },
  { tag: '#DangoteRefinery', label: 'Dangote Refinery Row', terms: ['dangote', 'dangote refinery', 'refinery'] },
  { tag: '#MurdersProbe', label: 'Elderly Murders & Crime Probes', terms: ['elderly murders', 'murder probe', 'kyalo mbobu', 'ngec'] },
  { tag: '#BodaBoda', label: 'Boda Boda Transport Sector', terms: ['boda boda', 'boda rider', 'motorcycle'] },
  { tag: '#FinanceEconomy', label: 'Economy & Public Debt', terms: ['finance bill', 'kra', 'taxes', 'cost of living', 'inflation', 'shilling', 'debt'] }
];

export function extractTrendingHashtags(items = [], topN = 5) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const trendMap = {};

  // 1. Scan explicit hashtags in tweet/headline text
  items.forEach(it => {
    const raw = `${it.title || ''} ${it.summary || ''} ${it.text || ''}`;
    const source = it.source_name || it.sourceName || (it.source_type === 'social_x' ? '𝕏 Twitter' : 'Press RSS');
    
    const hashMatches = raw.match(/#[a-zA-Z0-9_]{3,30}/g) || [];
    hashMatches.forEach(tag => {
      const normalized = tag.toLowerCase();
      if (!trendMap[normalized]) {
        trendMap[normalized] = {
          tag: tag,
          label: tag.replace('#', ''),
          count: 0,
          sources: new Set(),
          isExplicit: true
        };
      }
      trendMap[normalized].count++;
      trendMap[normalized].sources.add(source);
    });
  });

  // 2. Scan curated high-value Kenyan entities (with 1.25x priority weight)
  CURATED_TOPICS.forEach(topic => {
    let count = 0;
    const sources = new Set();

    items.forEach(it => {
      const clean = `${it.title || ''} ${it.summary || ''}`.toLowerCase();
      const matched = topic.terms.some(t => clean.includes(t));
      if (matched) {
        count++;
        const src = it.source_name || it.sourceName || (it.source_type === 'social_x' ? '𝕏 Twitter' : 'Press RSS');
        sources.add(src);
      }
    });

    if (count > 0) {
      const key = topic.tag.toLowerCase();
      trendMap[key] = {
        tag: topic.tag,
        label: topic.label,
        count: count,
        sources: sources,
        isCurated: true
      };
    }
  });

  // 3. Dynamic Word/Entity Frequency Extraction (for words >= 4 letters)
  const wordFreq = {};
  const wordSources = {};
  items.forEach(it => {
    const titleOnly = (it.title || '').replace(/https?:\/\/\S+/g, '').replace(/[^a-zA-Z0-9\s]/g, ' ');
    const tokens = titleOnly.toLowerCase().split(/\s+/).filter(w => w.length >= 4 && !STOPWORDS.has(w) && isNaN(w));
    const src = it.source_name || it.sourceName || 'Press';

    const uniqueTokens = Array.from(new Set(tokens));
    uniqueTokens.forEach(token => {
      wordFreq[token] = (wordFreq[token] || 0) + 1;
      if (!wordSources[token]) wordSources[token] = new Set();
      wordSources[token].add(src);
    });
  });

  // Merge discovered words
  Object.entries(wordFreq).forEach(([word, count]) => {
    if (count >= 4) {
      const formattedTag = `#${word.charAt(0).toUpperCase() + word.slice(1)}`;
      const key = formattedTag.toLowerCase();
      const isAlreadyCovered = Object.keys(trendMap).some(k => k.includes(word) || word.includes(k.replace('#', '')));
      if (!isAlreadyCovered && !trendMap[key]) {
        trendMap[key] = {
          tag: formattedTag,
          label: word.toUpperCase(),
          count: count,
          sources: wordSources[word],
          isCurated: false
        };
      }
    }
  });

  // 4. Score and format
  const results = Object.values(trendMap).map(item => {
    const sourceCount = item.sources.size;
    const score = item.count * 1.5 + sourceCount * 2.5 + (item.isCurated ? 2 : 0);
    let badge = '📈 Rising';
    if (item.count >= 10 || sourceCount >= 4) badge = '🔥 Hot Trend';
    else if (item.count >= 6 || sourceCount >= 3) badge = '⚡ Spiking';

    return {
      tag: item.tag,
      label: item.label,
      count: item.count,
      sourcesCount: sourceCount,
      sourcesList: Array.from(item.sources),
      score,
      badge
    };
  });

  results.sort((a, b) => b.score - a.score);

  // Deduplicate overlapping concepts
  const unique = [];
  const seen = new Set();
  for (const item of results) {
    const root = item.tag.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5);
    if (!seen.has(root)) {
      seen.add(root);
      unique.push(item);
    }
  }

  return unique.slice(0, Math.max(topN, 5));
}
