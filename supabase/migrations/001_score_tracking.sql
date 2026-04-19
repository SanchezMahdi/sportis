-- ============================================================
-- MIGRATION: Score-Tracking für Sportis
-- Datum: 19.04.2026
-- Beschreibung: Erweitere users-Tabelle mit Performance-Metriken
-- ============================================================

-- 1. Erweitere users-Tabelle mit Score-Tracking Spalten
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS (
  mvp_count integer DEFAULT 0,
  high_fives_received integer DEFAULT 0,
  sessions_played integer DEFAULT 0,
  reliability_score float DEFAULT 50,
  win_loss_ratio float DEFAULT 0,
  avg_rating float DEFAULT 0,
  last_activity timestamp with time zone
);

-- 2. Erstelle/erweitere reviews-Tabelle für MVP & High-Fives
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_mvp boolean DEFAULT false,
  high_five boolean DEFAULT false,
  rating integer DEFAULT 3,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(session_id, from_user_id, to_user_id)
);

-- 3. Erstelle score-history Tabelle für Trends
CREATE TABLE IF NOT EXISTS public.score_history (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mvp_count integer DEFAULT 0,
  high_fives_received integer DEFAULT 0,
  sessions_played integer DEFAULT 0,
  reliability_score float DEFAULT 50,
  win_loss_ratio float DEFAULT 0,
  avg_rating float DEFAULT 0,
  recorded_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS auf reviews und score_history
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_history ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies für reviews
DROP POLICY IF EXISTS "Reviews viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can submit reviews" ON public.reviews;

CREATE POLICY "Reviews viewable by everyone"
  ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can submit reviews"
  ON public.reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = from_user_id);

-- 6. RLS Policies für score_history
DROP POLICY IF EXISTS "Score history viewable by everyone" ON public.score_history;
CREATE POLICY "Score history viewable by everyone"
  ON public.score_history FOR SELECT USING (true);

-- 7. Funktion: Berechne Gesamtscore basierend auf MVPs, High-Fives, Zuverlässigkeit
CREATE OR REPLACE FUNCTION public.calculate_ranking_score(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_mvp_count INT;
  v_high_fives INT;
  v_reliability FLOAT;
  v_sessions INT;
  v_avg_rating FLOAT;
  v_score INT;
BEGIN
  SELECT 
    mvp_count,
    high_fives_received,
    reliability_score,
    sessions_played,
    avg_rating
  INTO v_mvp_count, v_high_fives, v_reliability, v_sessions, v_avg_rating
  FROM public.users
  WHERE id = p_user_id;

  -- Scoring-Formel:
  -- MVP: 25 Punkte pro MVP (Gewichtung 25%)
  -- High Fives: 15 Punkte pro High Five (Gewichtung 15%)
  -- Reliability: direkt zur Gewichtung (Gewichtung 30%)
  -- Sessions: Punkte basierend auf Volumen bis 100 Sessions (Gewichtung 10%)
  -- Rating: 20 Punkte pro Rating-Point (Gewichtung 20%)
  
  v_score := ROUND(
    (COALESCE(v_mvp_count, 0) * 25 * 0.25) +
    (COALESCE(v_high_fives, 0) * 15 * 0.15) +
    (COALESCE(v_reliability, 50) * 0.30) +
    (LEAST(COALESCE(v_sessions, 0), 100) * 0.10) +
    (COALESCE(v_avg_rating, 0) * 20 * 0.20)
  )::NUMERIC, 0)::INTEGER;
  
  RETURN v_score;
END;
$$ LANGUAGE plpgsql STABLE;

-- 8. Funktion: Bestimme Tier basierend auf Score
CREATE OR REPLACE FUNCTION public.get_tier_from_score(p_score INT)
RETURNS TEXT AS $$
BEGIN
  IF p_score >= 5000 THEN
    RETURN 'Platin';
  ELSIF p_score >= 3000 THEN
    RETURN 'Gold';
  ELSIF p_score >= 1500 THEN
    RETURN 'Silber';
  ELSE
    RETURN 'Bronze';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 9. Funktion: Finalize Session Scores (wird aufgerufen, wenn Session vorbei)
CREATE OR REPLACE FUNCTION public.finalize_session_scores(p_session_id UUID)
RETURNS VOID AS $$
DECLARE
  v_row RECORD;
BEGIN
  -- Setze RLS aus für diese Operation
  SET LOCAL row_security = OFF;
  
  -- Erhöhe MVP-Count für alle MVPs
  UPDATE public.users
  SET 
    mvp_count = mvp_count + 1,
    last_activity = NOW()
  WHERE id IN (
    SELECT DISTINCT to_user_id FROM public.reviews
    WHERE session_id = p_session_id AND is_mvp = TRUE
  );

  -- Erhöhe High-Fives Count
  UPDATE public.users
  SET 
    high_fives_received = high_fives_received + 1,
    last_activity = NOW()
  WHERE id IN (
    SELECT DISTINCT to_user_id FROM public.reviews
    WHERE session_id = p_session_id AND high_five = TRUE
  );

  -- Erhöhe sessions_played für alle Teilnehmer
  UPDATE public.users
  SET 
    sessions_played = sessions_played + 1,
    last_activity = NOW()
  WHERE id IN (
    SELECT DISTINCT user_id FROM public.session_participants
    WHERE session_id = p_session_id
  );

  -- Berechne Average Rating für alle Teilnehmer
  FOR v_row IN (
    SELECT DISTINCT to_user_id FROM public.reviews WHERE session_id = p_session_id
  ) LOOP
    UPDATE public.users
    SET avg_rating = (
      SELECT COALESCE(AVG(rating)::FLOAT, 0)
      FROM public.reviews
      WHERE to_user_id = v_row.to_user_id AND rating IS NOT NULL
    )
    WHERE id = v_row.to_user_id;
  END LOOP;

  -- Speichere Snapshot in score_history
  INSERT INTO public.score_history (
    user_id,
    mvp_count,
    high_fives_received,
    sessions_played,
    reliability_score,
    win_loss_ratio,
    avg_rating
  )
  SELECT 
    id,
    mvp_count,
    high_fives_received,
    sessions_played,
    reliability_score,
    win_loss_ratio,
    avg_rating
  FROM public.users
  WHERE id IN (
    SELECT DISTINCT user_id FROM public.session_participants
    WHERE session_id = p_session_id
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.finalize_session_scores(UUID) TO authenticated;

-- 10. Funktion: Get User Ranking (globales Leaderboard)
CREATE OR REPLACE FUNCTION public.get_user_ranking(p_sport TEXT DEFAULT NULL, p_city TEXT DEFAULT NULL)
RETURNS TABLE(
  rank BIGINT,
  user_id UUID,
  name TEXT,
  avatar_url TEXT,
  city TEXT,
  score INT,
  tier TEXT,
  mvp_count INT,
  high_fives_received INT,
  sessions_played INT,
  reliability_score FLOAT,
  avg_rating FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY public.calculate_ranking_score(u.id) DESC) as rank,
    u.id,
    u.name,
    u.avatar_url,
    u.city,
    public.calculate_ranking_score(u.id) as score,
    public.get_tier_from_score(public.calculate_ranking_score(u.id)) as tier,
    u.mvp_count,
    u.high_fives_received,
    u.sessions_played,
    u.reliability_score,
    u.avg_rating
  FROM public.users u
  WHERE 
    (p_sport IS NULL OR p_sport = ANY(u.sports)) AND
    (p_city IS NULL OR u.city ILIKE '%' || p_city || '%')
  ORDER BY score DESC;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.get_user_ranking(TEXT, TEXT) TO authenticated, anon;

-- 11. Funktion: Get User Ranking mit Rang (privat für einen User)
CREATE OR REPLACE FUNCTION public.get_my_ranking(p_user_id UUID, p_sport TEXT DEFAULT NULL)
RETURNS TABLE(
  my_rank BIGINT,
  my_score INT,
  my_tier TEXT,
  rank_change INT
) AS $$
DECLARE
  v_current_rank BIGINT;
  v_current_score INT;
BEGIN
  SELECT rank, score INTO v_current_rank, v_current_score
  FROM public.get_user_ranking(p_sport, NULL)
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT 
    v_current_rank,
    v_current_score,
    public.get_tier_from_score(v_current_score),
    0::INT;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.get_my_ranking(UUID, TEXT) TO authenticated;

-- 12. Trigger: Aktualisiere last_activity beim Beitreten
CREATE OR REPLACE FUNCTION public.update_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET last_activity = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_session_join_update_activity ON public.session_participants;
CREATE TRIGGER on_session_join_update_activity
  AFTER INSERT ON public.session_participants
  FOR EACH ROW EXECUTE PROCEDURE public.update_last_activity();

-- 13. Trigger: Aktualisiere reliability_score wenn Nutzer verlässt
CREATE OR REPLACE FUNCTION public.update_reliability_score()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Senke reliability_score, wenn Nutzer verlässt
    UPDATE public.users
    SET reliability_score = GREATEST(0, reliability_score - 5)
    WHERE id = OLD.user_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_participant_leave ON public.session_participants;
CREATE TRIGGER on_participant_leave
  AFTER DELETE ON public.session_participants
  FOR EACH ROW EXECUTE PROCEDURE public.update_reliability_score();

-- ============================================================
-- TEST DATA (optional)
-- ============================================================

-- Uncomment um Test-Scores zu erstellen (für Demo):
-- UPDATE public.users SET 
--   mvp_count = 5,
--   high_fives_received = 12,
--   sessions_played = 8,
--   reliability_score = 85,
--   avg_rating = 4.2
-- WHERE id = (SELECT id FROM public.users LIMIT 1);

-- ============================================================
-- DONE
-- ============================================================

