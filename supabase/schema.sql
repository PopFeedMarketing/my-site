-- ============================================================
--  POPFEED — SUPABASE SCHEMA
--  Run this in your Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- ── 1. user_settings ────────────────────────────────────────
--  One row per user. Stores all agent/automation preferences.
--  n8n reads this via the Supabase service role key.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agent_name       TEXT,
  business_name    TEXT,
  post_frequency   TEXT DEFAULT 'daily',        -- daily | every_other | weekly | custom
  post_types       JSONB DEFAULT '{}',           -- { listings: true, tips: true, ... }
  preferred_times  TEXT DEFAULT 'morning',       -- morning | afternoon | evening | optimal
  tone             TEXT DEFAULT 'professional',  -- professional | casual | luxury | energetic
  hashtags         BOOLEAN DEFAULT true,
  auto_post        BOOLEAN DEFAULT false,
  platforms        TEXT[] DEFAULT '{}',          -- ['instagram', 'tiktok', 'x', ...]
  custom_prompt    TEXT,                         -- free-text niche/brand description for AI
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- ── 2. automation_runs ──────────────────────────────────────
--  One row per time a user triggers a run.
--  Created by trigger-automation.js, updated by n8n on completion.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_runs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status           TEXT DEFAULT 'running',  -- running | completed | failed
  posts_generated  INT DEFAULT 0,
  started_at       TIMESTAMPTZ DEFAULT now(),
  completed_at     TIMESTAMPTZ,
  error            TEXT
);

-- ── 3. posts ────────────────────────────────────────────────
--  One row per generated post. Written by n8n after generation.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  run_id     UUID REFERENCES automation_runs(id) ON DELETE SET NULL,
  platform   TEXT NOT NULL,              -- instagram | tiktok | x | facebook | linkedin
  content    TEXT NOT NULL,             -- the generated caption/post text
  status     TEXT DEFAULT 'pending',    -- pending | posted | failed
  posted_at  TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 4. post_analytics ───────────────────────────────────────
--  Engagement metrics per post. Written by n8n after fetching
--  from platform APIs. Multiple rows per post (one per fetch).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_analytics (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  likes      INT DEFAULT 0,
  views      INT DEFAULT 0,
  reach      INT DEFAULT 0,
  fetched_at TIMESTAMPTZ DEFAULT now()
);

-- ── Row Level Security ───────────────────────────────────────
--  Users can only see their own rows.
--  n8n uses the service role key and bypasses RLS.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE user_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_runs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_analytics   ENABLE ROW LEVEL SECURITY;

-- user_settings
CREATE POLICY "Users can read own settings"
  ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE USING (auth.uid() = user_id);

-- automation_runs
CREATE POLICY "Users can read own runs"
  ON automation_runs FOR SELECT USING (auth.uid() = user_id);

-- posts
CREATE POLICY "Users can read own posts"
  ON posts FOR SELECT USING (auth.uid() = user_id);

-- post_analytics
CREATE POLICY "Users can read own analytics"
  ON post_analytics FOR SELECT USING (auth.uid() = user_id);

-- ── updated_at trigger ───────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
