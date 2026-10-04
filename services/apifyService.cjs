const fs = require('fs');
const path = require('path');
const { ApifyClient } = require('apify-client');

// Dedicated database files
const DATA_DIR = path.join(process.cwd(), 'data');
const TWEETS_FILE = path.join(DATA_DIR, 'tweets.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

// Comprehensive Categorized List of High-Impact Kenyan X Accounts
const KENYA_ACCOUNTS = {
  media: [
    'NationAfrica',
    'StandardKenya',
    'CitizenTVKenya',
    'TheStarKenya',
    'CapitalFMKenya',
    'KBCChannel1',
    'Kenyans',
    'PeopleDailyKe',
    'KTNNewsKE',
    'ntvkenya',
    'tv47news',
    'SpiceFMKE'
  ],
  executive: [
    'StateHouseKenya',
    'WilliamsRuto',
    'KindikiKithure',
    'Rigathi',
    'SpokespersonGoK',
    'InteriorKE'
  ],
  security: [
    'NPSOfficial_KE',
    'DCI_Kenya',
    'IEBCKenya',
    'Kenyajudiciary',
    'NCIC_Kenya',
    'IPOA_KE',
    'ORPPKenya'
  ],
  political: [
    'RailaOdinga',
    'skmusyoka',
    'edwinsifuna',
    'Babu_Owino'
  ],
  civic: [
    'PesaCheck',
    'KenyaHRC',
    'AfriCOG',
    'Ma3Route'
  ]
};

const ALL_KENYA_HANDLES = Object.values(KENYA_ACCOUNTS).flat();

class ApifyService {
  constructor() {
    this.token = process.env.APIFY_API_TOKEN || this.loadSavedToken();
    this.client = this.token ? new ApifyClient({ token: this.token }) : null;
    this.cacheDurationMs = 24 * 60 * 60 * 1000; // 24 Hours in milliseconds
    this.data = this.loadTweetsDatabase();
  }

  loadSavedToken() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        return cfg.apifyApiToken || '';
      }
    } catch (err) {
      console.warn('[ApifyService] Could not read config file:', err.message);
    }
    return '';
  }

  setToken(newToken) {
    this.token = (newToken || '').trim();
    this.client = this.token ? new ApifyClient({ token: this.token }) : null;
    try {
      let cfg = {};
      if (fs.existsSync(CONFIG_FILE)) {
        cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      }
      cfg.apifyApiToken = this.token;
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
      console.log('[ApifyService] API token updated and stored in database config.');
    } catch (err) {
      console.error('[ApifyService] Failed to persist token:', err.message);
    }
  }

  loadTweetsDatabase() {
    try {
      if (fs.existsSync(TWEETS_FILE)) {
        const raw = JSON.parse(fs.readFileSync(TWEETS_FILE, 'utf8'));
        if (raw && Array.isArray(raw.posts)) {
          return raw;
        }
      }
    } catch (err) {
      console.error('[ApifyService] Error reading tweets database:', err.message);
    }

    // Default structure with strictly empty posts awaiting genuine live scrape
    const defaultData = {
      lastHarvestedAt: null,
      expiresAt: null,
      totalPosts: 0,
      accountsCount: ALL_KENYA_HANDLES.length,
      monitoredHandles: ALL_KENYA_HANDLES,
      posts: []
    };
    this.saveTweetsDatabase(defaultData);
    return defaultData;
  }

  saveTweetsDatabase(data) {
    try {
      fs.writeFileSync(TWEETS_FILE, JSON.stringify(data, null, 2), 'utf8');
      this.data = data;
    } catch (err) {
      console.error('[ApifyService] Error writing tweets database:', err.message);
    }
  }

  isCacheValid() {
    if (!this.data || !this.data.lastHarvestedAt || !Array.isArray(this.data.posts) || this.data.posts.length === 0) {
      return false;
    }
    const age = Date.now() - new Date(this.data.lastHarvestedAt).getTime();
    return age < this.cacheDurationMs;
  }

  getCacheStatus() {
    const valid = this.isCacheValid();
    const lastHarvest = this.data.lastHarvestedAt ? new Date(this.data.lastHarvestedAt) : null;
    const now = Date.now();
    const msRemaining = lastHarvest ? Math.max(0, (lastHarvest.getTime() + this.cacheDurationMs) - now) : 0;
    const hoursRemaining = (msRemaining / (1000 * 60 * 60)).toFixed(1);

    return {
      isCached: valid,
      hasToken: Boolean(this.token),
      lastHarvestedAt: this.data.lastHarvestedAt || null,
      expiresAt: this.data.expiresAt || null,
      hoursRemaining: parseFloat(hoursRemaining),
      totalPosts: this.data.posts ? this.data.posts.length : 0,
      accountsCount: ALL_KENYA_HANDLES.length,
      categories: KENYA_ACCOUNTS
    };
  }

  getCategorizedAccounts() {
    return {
      total: ALL_KENYA_HANDLES.length,
      categories: KENYA_ACCOUNTS,
      allHandles: ALL_KENYA_HANDLES
    };
  }

  // Detect topic and early threat risk from tweet text
  classifyTweet(text) {
    const lower = (text || '').toLowerCase();
    let topic = 'National Politics';
    let risk = 'LOW';

    if (lower.includes('election') || lower.includes('iebc') || lower.includes('voter') || lower.includes('2027')) {
      topic = 'Elections & Succession';
    } else if (lower.includes('protest') || lower.includes('strike') || lower.includes('maandamano') || lower.includes('gen z') || lower.includes('clash') || lower.includes('tear gas')) {
      topic = 'Civil Unrest & Protests';
      risk = 'HIGH';
    } else if (lower.includes('tax') || lower.includes('budget') || lower.includes('finance bill') || lower.includes('cost of living') || lower.includes('sha') || lower.includes('nhif')) {
      topic = 'Economy & Fiscal Policy';
      risk = 'MEDIUM';
    } else if (lower.includes('ruto') || lower.includes('gachagua') || lower.includes('cabinet') || lower.includes('uda') || lower.includes('odm') || lower.includes('coalition')) {
      topic = 'Executive & Coalition Dynamics';
    } else if (lower.includes('court') || lower.includes('ruling') || lower.includes('dci') || lower.includes('arrest') || lower.includes('police')) {
      topic = 'Judiciary & Legal Disputes';
    }

    if (lower.includes('crisis') || lower.includes('killed') || lower.includes('violence') || lower.includes('ultimatum') || lower.includes('impeach')) {
      risk = 'HIGH';
    } else if (lower.includes('warning') || lower.includes('dispute') || lower.includes('standoff') || lower.includes('probe')) {
      if (risk !== 'HIGH') risk = 'MEDIUM';
    }

    return { topic, risk };
  }

  findAccountCategory(handle) {
    const clean = handle.toLowerCase();
    for (const [cat, handles] of Object.entries(KENYA_ACCOUNTS)) {
      if (handles.some(h => h.toLowerCase() === clean)) return cat;
    }
    return 'general';
  }

  // Core Harvest Function: Calls Apify ONLY if cache is expired or force=true
  async harvestAllAccounts(force = false) {
    // 1. Check if database cache is still within 24-hour window
    if (!force && this.isCacheValid()) {
      console.log(`[ApifyService] 24-hour cache active (Harvested: ${this.data.lastHarvestedAt}). Skipping Apify API call to preserve quotas.`);
      return {
        fromCache: true,
        posts: this.data.posts,
        status: this.getCacheStatus()
      };
    }

    console.log(`[ApifyService] 24-hour window expired or force refresh requested. Initiating Apify harvest for ${ALL_KENYA_HANDLES.length} accounts...`);

    // 2. If token is available, invoke apidojo/tweet-scraper
    if (this.token && this.client) {
      try {
        console.log(`[ApifyService] Calling Actor 'apidojo/tweet-scraper' for genuine live tweets...`);
        // Scrape top monitored Kenyan handles within Apify limits
        const run = await this.client.actor('apidojo/tweet-scraper').call({
          twitterHandles: ALL_KENYA_HANDLES.slice(0, 10),
          maxItems: 10,
          sort: 'Latest',
          tweetLanguage: 'en'
        });

        console.log(`[ApifyService] Apify run complete (Run ID: ${run.id}). Fetching dataset items...`);
        const { items } = await this.client.dataset(run.defaultDatasetId).listItems();

        if (Array.isArray(items) && items.length > 0) {
          const normalized = items
            .map(tweet => {
              const handle = tweet.author?.userName || tweet.user?.screen_name || 'kenya_source';
              const text = tweet.text || tweet.full_text || '';
              const { topic, risk } = this.classifyTweet(text);
              const category = this.findAccountCategory(handle);

              return {
                id: `x_${tweet.id || tweet.tweetId}`,
                tweetId: tweet.id || tweet.tweetId,
                title: text.slice(0, 110).trim() + (text.length > 110 ? '...' : ''),
                summary: text,
                link: tweet.url || `https://x.com/${handle}/status/${tweet.id || tweet.tweetId}`,
                authorHandle: handle,
                authorName: tweet.author?.name || tweet.user?.name || handle,
                sourceId: 'social_x',
                sourceName: `@${handle} (X/Twitter)`,
                sourceColor: '#1d9bf0',
                sourceType: 'social_x',
                pubDate: tweet.createdAt ? new Date(tweet.createdAt).toISOString() : new Date().toISOString(),
                scannedAt: new Date().toISOString(),
                category,
                topic,
                initialRisk: risk,
                metrics: {
                  likes: tweet.likeCount || tweet.favorite_count || 0,
                  retweets: tweet.retweetCount || tweet.retweet_count || 0,
                  replies: tweet.replyCount || tweet.reply_count || 0
                }
              };
            })
            .filter(t => t.summary && t.summary.trim().length > 0);

          if (normalized.length > 0) {
            const dbData = {
              lastHarvestedAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + this.cacheDurationMs).toISOString(),
              totalPosts: normalized.length,
              accountsCount: ALL_KENYA_HANDLES.length,
              monitoredHandles: ALL_KENYA_HANDLES,
              posts: normalized
            };
            this.saveTweetsDatabase(dbData);
            console.log(`[ApifyService] Successfully harvested and saved ${normalized.length} GENUINE live posts from Apify.`);
            return {
              fromCache: false,
              posts: normalized,
              status: this.getCacheStatus()
            };
          }
        }
      } catch (err) {
        console.error(`[ApifyService] Apify actor execution failed:`, err.message);
      }
    } else {
      console.warn('[ApifyService] No valid APIFY_API_TOKEN configured.');
    }

    return {
      fromCache: true,
      posts: (this.data && this.data.posts) ? this.data.posts : [],
      status: this.getCacheStatus()
    };
  }
}

module.exports = new ApifyService();
