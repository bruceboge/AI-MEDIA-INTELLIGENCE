-- ==========================================================
-- AI MEDIA INTELLIGENCE - SUPABASE DATABASE SCHEMA
-- Copy & Run this in Supabase Dashboard -> SQL Editor
-- ==========================================================

-- 1. Extraction Sessions Table
CREATE TABLE IF NOT EXISTS public.extraction_sessions (
    id TEXT PRIMARY KEY,
    session_type TEXT NOT NULL, -- 'rss', 'apify_x', 'topic_search', 'manual_reset'
    status TEXT DEFAULT 'completed',
    items_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Intelligence Items Table (Unified RSS Articles & Apify 𝕏 Posts)
CREATE TABLE IF NOT EXISTS public.intelligence_items (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES public.extraction_sessions(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL, -- 'rss' or 'social_x'
    source_name TEXT,
    author_handle TEXT,
    author_name TEXT,
    title TEXT,
    summary TEXT,
    link TEXT,
    category TEXT DEFAULT 'trends',
    topic TEXT,
    risk_level TEXT DEFAULT 'STABLE',
    metrics JSONB DEFAULT '{}'::jsonb,
    pub_date TIMESTAMPTZ,
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes for Ultra-Fast Filtering & Search
CREATE INDEX IF NOT EXISTS idx_intel_source ON public.intelligence_items (source_type);
CREATE INDEX IF NOT EXISTS idx_intel_category ON public.intelligence_items (category);
CREATE INDEX IF NOT EXISTS idx_intel_session ON public.intelligence_items (session_id);
CREATE INDEX IF NOT EXISTS idx_intel_pubdate ON public.intelligence_items (pub_date DESC);

-- 4. Enable Row Level Security (RLS) & Public Policies for Demo App
ALTER TABLE public.extraction_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on extraction_sessions" ON public.extraction_sessions;
CREATE POLICY "Allow all on extraction_sessions" ON public.extraction_sessions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.intelligence_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on intelligence_items" ON public.intelligence_items;
CREATE POLICY "Allow all on intelligence_items" ON public.intelligence_items FOR ALL USING (true) WITH CHECK (true);
