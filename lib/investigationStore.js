import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const INVESTIGATIONS_FILE = path.join(DATA_DIR, 'investigations.json');

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(INVESTIGATIONS_FILE)) {
    fs.writeFileSync(INVESTIGATIONS_FILE, JSON.stringify([], null, 2), 'utf8');
    return [];
  }
  try {
    const raw = fs.readFileSync(INVESTIGATIONS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveStore(items) {
  try {
    fs.writeFileSync(INVESTIGATIONS_FILE, JSON.stringify(items, null, 2), 'utf8');
  } catch (e) {
    console.error('[INVESTIGATION_STORE] Save failed:', e.message);
  }
}

export function saveInvestigation(data) {
  const items = ensureStore();
  const id = 'inv_' + Date.now();
  const record = {
    id,
    query: data.query || 'National Overview',
    createdAt: new Date().toISOString(),
    totalScrapedItems: data.totalScrapedItems || 0,
    report: data.report || null,
    sources: data.sources || []
  };

  // Prepend to list, keeping max 50 historical dossiers
  items.unshift(record);
  if (items.length > 50) {
    items.length = 50;
  }
  saveStore(items);

  return record;
}

export function getInvestigation(id) {
  const items = ensureStore();
  if (!id || id === 'latest') {
    return items[0] || null;
  }
  return items.find(it => it.id === id) || items[0] || null;
}

export function listInvestigations(limit = 10) {
  const items = ensureStore();
  return items.slice(0, limit).map(it => ({
    id: it.id,
    query: it.query,
    headline: it.report?.headline || it.query,
    subhead: it.report?.subhead || '',
    dateline: it.report?.dateline || 'NAIROBI',
    readingTimeMinutes: it.report?.readingTimeMinutes || 5,
    totalSources: it.sources?.length || 0,
    createdAt: it.createdAt
  }));
}
