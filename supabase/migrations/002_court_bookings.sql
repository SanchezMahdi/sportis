-- ============================================================
-- MIGRATION: Court Booking für Platzbuchungen
-- Datum: 19.04.2026
-- Beschreibung: Monetarisierung durch Platzbuchungen
-- ============================================================

-- 1. Booking-Partner Tabelle
CREATE TABLE IF NOT EXISTS public.court_partners (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  logo_url text,
  api_key text NOT NULL,
  api_base_url text,
  commission_rate float DEFAULT 0.15,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Platzbuchungen Tabelle
CREATE TABLE IF NOT EXISTS public.court_bookings (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  court_id uuid REFERENCES public.courts(id) ON DELETE SET NULL,
  partner_id uuid REFERENCES public.court_partners(id) ON DELETE SET NULL,
  partner_booking_id text,
  court_name text NOT NULL,
  court_address text,
  booking_date date NOT NULL,
  time_from time NOT NULL,
  time_to time NOT NULL,
  duration_minutes integer,
  price_cents integer,
  currency text DEFAULT 'EUR',
  status text DEFAULT 'confirmed',
  booking_url text,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Provisionen Tabelle (für Cashflow Tracking)
CREATE TABLE IF NOT EXISTS public.earnings (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.court_bookings(id) ON DELETE CASCADE,
  partner_id uuid REFERENCES public.court_partners(id) ON DELETE SET NULL,
  commission_amount_cents integer NOT NULL,
  commission_rate float,
  status text DEFAULT 'pending',
  notes text,
  calculated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  paid_at timestamp with time zone
);

-- 4. Enable RLS
ALTER TABLE public.court_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earnings ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies für court_partners
DROP POLICY IF EXISTS "Court partners public" ON public.court_partners;
CREATE POLICY "Court partners public"
  ON public.court_partners FOR SELECT USING (is_active = true);

-- 6. RLS Policies für court_bookings
DROP POLICY IF EXISTS "Bookings viewable by owner" ON public.court_bookings;
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON public.court_bookings;

CREATE POLICY "Bookings viewable by owner"
  ON public.court_bookings FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Authenticated users can create bookings"
  ON public.court_bookings FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON public.court_bookings FOR UPDATE USING (auth.uid() = user_id);

-- 7. RLS Policies für earnings (nur admins)
DROP POLICY IF EXISTS "Earnings admin only" ON public.earnings;
CREATE POLICY "Earnings admin only"
  ON public.earnings FOR SELECT USING (auth.role() = 'service_role');

-- 8. Trigger: Berechne Provision bei Booking
CREATE OR REPLACE FUNCTION public.calculate_booking_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_commission_rate float;
  v_commission_amount integer;
BEGIN
  -- Hole Commission-Rate vom Partner
  SELECT commission_rate INTO v_commission_rate
  FROM public.court_partners
  WHERE id = NEW.partner_id;

  v_commission_rate := COALESCE(v_commission_rate, 0.15);
  v_commission_amount := ROUND(NEW.price_cents * v_commission_rate)::INT;

  -- Erstelle Earnings-Eintrag
  INSERT INTO public.earnings (
    booking_id,
    partner_id,
    commission_amount_cents,
    commission_rate,
    status
  ) VALUES (
    NEW.id,
    NEW.partner_id,
    v_commission_amount,
    v_commission_rate,
    'pending'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_booking_calculate_commission ON public.court_bookings;
CREATE TRIGGER on_booking_calculate_commission
  AFTER INSERT ON public.court_bookings
  FOR EACH ROW EXECUTE PROCEDURE public.calculate_booking_commission();

-- 9. Funktion: Get User's Bookings
CREATE OR REPLACE FUNCTION public.get_user_bookings(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  court_name TEXT,
  court_address TEXT,
  booking_date DATE,
  time_from TIME,
  time_to TIME,
  price_cents INT,
  status TEXT,
  partner_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cb.id,
    cb.court_name,
    cb.court_address,
    cb.booking_date,
    cb.time_from,
    cb.time_to,
    cb.price_cents,
    cb.status,
    cp.name,
    cb.created_at
  FROM public.court_bookings cb
  LEFT JOIN public.court_partners cp ON cp.id = cb.partner_id
  WHERE cb.user_id = p_user_id
  ORDER BY cb.booking_date DESC;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.get_user_bookings(UUID) TO authenticated;

-- 10. Funktion: Get Admin Earnings Summary
CREATE OR REPLACE FUNCTION public.get_earnings_summary(p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS TABLE(
  total_bookings INT,
  total_revenue_cents INT,
  total_commission_cents INT,
  pending_commission_cents INT,
  paid_commission_cents INT,
  top_partner_name TEXT,
  top_partner_commission INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT cb.id)::INT,
    SUM(cb.price_cents)::INT,
    SUM(e.commission_amount_cents)::INT,
    SUM(CASE WHEN e.status = 'pending' THEN e.commission_amount_cents ELSE 0 END)::INT,
    SUM(CASE WHEN e.status = 'paid' THEN e.commission_amount_cents ELSE 0 END)::INT,
    cp.name,
    SUM(e.commission_amount_cents)::INT
  FROM public.court_bookings cb
  JOIN public.earnings e ON e.booking_id = cb.id
  LEFT JOIN public.court_partners cp ON cp.id = e.partner_id
  WHERE (p_start_date IS NULL OR cb.booking_date >= p_start_date)
    AND (p_end_date IS NULL OR cb.booking_date <= p_end_date)
  GROUP BY cp.id, cp.name
  ORDER BY SUM(e.commission_amount_cents) DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_earnings_summary(DATE, DATE) TO service_role;

-- ============================================================
-- TEST DATA (optional)
-- ============================================================

-- Insert Test Partner:
-- INSERT INTO public.court_partners (name, api_key, commission_rate, is_active)
-- VALUES ('ReservationHero', 'test-api-key-123', 0.15, true);

-- ============================================================
-- DONE
-- ============================================================

