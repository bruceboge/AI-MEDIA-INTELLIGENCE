/**
 * Persistent Database Layer for AI Media Intelligence
 * Handles Supabase Cloud Postgres with local resilient JSON store
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL.startsWith('http')) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false }
    });
  } catch (e) {
    console.warn('[DB] Supabase init warning:', e.message);
  }
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'intelligence_db.json');

function ensureLocalDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initData = {
      sessions: [],
      items: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initData, null, 2), 'utf8');
    return initData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { sessions: [], items: [] };
  }
}

function saveLocalDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('[DB] Failed to save local database:', e.message);
  }
}

/**
 * Save an extraction session along with all extracted items
 */
export async function saveExtractionSession(sessionType, rawItems = [], metadata = {}) {
  const sessionId = 'extr_' + Date.now();
  const timestamp = new Date().toISOString();

  // Normalize items for database schema
  const normalizedItems = rawItems.map((item, idx) => ({
    id: item.id || `item_${sessionId}_${idx}`,
    session_id: sessionId,
    source_type: item.sourceType || (item.authorHandle ? 'social_x' : 'rss'),
    source_name: item.sourceName || item.authorName || 'Kenya Source',
    author_handle: item.authorHandle || null,
    author_name: item.authorName || null,
    title: item.title || item.summary || 'Intelligence Item',
    summary: item.summary || item.text || item.title || '',
    link: item.link || '',
    category: item.category || item.politicalCategory || 'trends',
    topic: item.topic || 'General News',
    risk_level: item.tensionRisk || item.initialRisk || 'STABLE',
    metrics: item.metrics || {},
    pub_date: item.pubDate || timestamp,
    scanned_at: timestamp,
    created_at: timestamp
  }));

  const sessionRecord = {
    id: sessionId,
    session_type: sessionType,
    status: 'completed',
    items_count: normalizedItems.length,
    metadata,
    created_at: timestamp
  };

  // 1. Always record in persistent local store
  const localDb = ensureLocalDb();
  localDb.sessions.unshift(sessionRecord);
  // Add new items, avoiding exact duplicate IDs
  const existingIds = new Set(localDb.items.map(i => i.id));
  const newItemsToStore = normalizedItems.filter(i => !existingIds.has(i.id));
  localDb.items.unshift(...newItemsToStore);
  saveLocalDb(localDb);

  // 2. Try persisting to Supabase Cloud if available
  if (supabase) {
    try {
      await supabase.from('extraction_sessions').insert([sessionRecord]);
      if (newItemsToStore.length > 0) {
        // Chunk inserts to avoid payload limits
        for (let i = 0; i < newItemsToStore.length; i += 50) {
          const chunk = newItemsToStore.slice(i, i + 50);
          await supabase.from('intelligence_items').upsert(chunk);
        }
      }
    } catch (err) {
      console.warn('[DB] Supabase cloud write note:', err.message);
    }
  }

  return {
    sessionId,
    itemsCount: normalizedItems.length,
    items: normalizedItems,
    session: sessionRecord
  };
}

/**
 * Retrieve extraction sessions list
 */
export async function getExtractionSessions(limit = 30) {
  // Check Supabase first
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('extraction_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (!error && Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (e) {}
  }

  // Fallback to local store
  const localDb = ensureLocalDb();
  return (localDb.sessions || []).slice(0, limit);
}

/**
 * Retrieve intelligence items from database with multi-filtering
 */
export async function getIntelligenceItems({
  sourceType = 'all',
  category = 'all',
  sessionId = null,
  search = '',
  limit = 80
} = {}) {
  // Check Supabase first
  if (supabase) {
    try {
      let query = supabase.from('intelligence_items').select('*').order('pub_date', { ascending: false });

      if (sourceType && sourceType !== 'all') {
        query = query.eq('source_type', sourceType);
      }
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }
      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }
      if (search && search.trim()) {
        query = query.ilike('title', `%${search.trim()}%`);
      }

      const { data, error } = await query.limit(limit);
      if (!error && Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (e) {}
  }

  // Fallback to local persistent store
  const localDb = ensureLocalDb();
  let items = [...(localDb.items || [])];

  if (sourceType && sourceType !== 'all') {
    items = items.filter(i => i.source_type === sourceType);
  }
  if (category && category !== 'all') {
    const c = category.toLowerCase();
    items = items.filter(i => (i.category || '').toLowerCase().includes(c) || (i.topic || '').toLowerCase().includes(c));
  }
  if (sessionId) {
    items = items.filter(i => i.session_id === sessionId);
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    items = items.filter(i => (i.title || '').toLowerCase().includes(q) || (i.summary || '').toLowerCase().includes(q));
  }

  return items.slice(0, limit);
}

/**
 * Reset everything: clears temporary sessions and marks cache expired
 */
export async function resetDatabase() {
  const localDb = ensureLocalDb();
  localDb.sessions = [];
  localDb.items = [];
  saveLocalDb(localDb);

  if (supabase) {
    try {
      await supabase.from('intelligence_items').delete().neq('id', '___');
      await supabase.from('extraction_sessions').delete().neq('id', '___');
    } catch (e) {}
  }

  return { success: true, message: 'All database extraction sessions and items purged.' };
}
