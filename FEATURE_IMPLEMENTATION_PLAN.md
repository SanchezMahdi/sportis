# Sportis Feature Implementation Plan

## Zusammenfassung der 3 Features

### 1. **Score-Tracking** 
- **Nutzerfrage**: "Wie gut war ich?"
- **Business-Ziel**: Retention durch Datenpflege
- **Zweck**: Nutzer kommen immer wieder zurück, um ihre Leistungsdaten zu sehen und zu verbessern

### 2. **Ranking**
- **Nutzerfrage**: "Wer ist so gut wie ich?"
- **Business-Ziel**: Präziseres Matchmaking & höhere Zufriedenheit
- **Zweck**: Nutzer mit ähnlichen Fähigkeiten zusammenbringen, dadurch bessere Spiele

### 3. **Platzbuchung**
- **Nutzerfrage**: "Wo können wir spielen?"
- **Business-Ziel**: Monetarisierung durch Provisionen pro Buchung
- **Zweck**: Umsatz generieren durch Vermittlung von Platzbuchungen

---

## Feature 1: Score-Tracking

### Zweck
Nutzer können ihre Leistungsmetriken nach jeder Session verfolgen (MVP-Punkte, High-Fives, Gewinnquote, etc.)

### Bestehende Komponenten
- ✅ `PostGameVoting.jsx` - Abstimmung nach Session (MVP, High Fives)
- ✅ `reviews` Tabelle (bereits in SQL erstellt mit: `is_mvp`, `high_five`)
- ✅ `Profil.jsx` - zeigt bereits Session-Statistiken

### Zu implementieren

#### 1.1 Datenbank-Schema erweitern
**Datei**: `supabase-schema.sql`
```sql
-- Erweitere 'users' Tabelle mit Score-Metriken
ALTER TABLE public.users ADD COLUMN (
  mvp_count INT DEFAULT 0,
  high_fives_received INT DEFAULT 0,
  sessions_played INT DEFAULT 0,
  reliability_score FLOAT DEFAULT 50,  -- 0-100, abhängig von Pünktlichkeit
  win_loss_ratio FLOAT DEFAULT 0,      -- Gewinnquote (für Ranking)
  avg_rating FLOAT DEFAULT 0           -- Durchschnittliche Bewertung durch andere
);

-- 'reviews' Tabelle um Felder erweitern (falls nicht vorhanden)
ALTER TABLE public.reviews ADD COLUMN (
  rating INT DEFAULT 3,  -- 1-5 Stars für allgemeine Leistung
  notes TEXT             -- optionale Notizen
) IF NOT EXISTS;
```

#### 1.2 Neue Komponente: `ScoreTracker.jsx`
**Pfad**: `src/components/ScoreTracker.jsx`
- Zeigt persönliche Statistiken
- Visualisiert Trends über Zeit
- Hat Tabs für verschiedene Metriken (MVP, High Fives, Zuverlässigkeit, etc.)

#### 1.3 Profil-Seite erweitern
**Datei**: `src/pages/Profil.jsx`
- Neuer Tab: "Statistiken" mit detaillierten Score-Metriken
- Grafiken/Charts zeigen Fortschritt über Zeit
- Badges/Achievements für Meilensteine (z.B. "10 MVPs")

#### 1.4 API-Funktionen (RPC in Supabase)
```sql
-- Funktion: Scores aktualisieren wenn Session beendet wird
CREATE OR REPLACE FUNCTION public.finalize_session_scores(p_session_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Erhöhe MVP-Count für MVP-Gewinner
  UPDATE public.users SET mvp_count = mvp_count + 1
  WHERE id IN (
    SELECT to_user_id FROM public.reviews 
    WHERE session_id = p_session_id AND is_mvp = TRUE
  );
  
  -- Erhöhe High-Fives
  UPDATE public.users SET high_fives_received = high_fives_received + 1
  WHERE id IN (
    SELECT to_user_id FROM public.reviews 
    WHERE session_id = p_session_id AND high_five = TRUE
  );
  
  -- Aktualisiere sessions_played für alle Teilnehmer
  UPDATE public.users SET sessions_played = sessions_played + 1
  WHERE id IN (
    SELECT user_id FROM public.session_participants 
    WHERE session_id = p_session_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Feature 2: Ranking

### Zweck
Nutzer sehen, wie sie im Vergleich zu anderen abschneiden (basierend auf Skill & Zuverlässigkeit)

### Bestehende Komponenten
- ✅ `skill_level` in sessions (Anfänger, Mittel, Experte)
- ✅ Reviews-System existiert bereits

### Zu implementieren

#### 2.1 Ranking-Algorithmus
**Neue Datei**: `src/lib/rankingEngine.js`
```javascript
// Berechnet Ranking-Score basierend auf:
// - MVPs (wichtig)
// - High Fives (wichtig)  
// - Zuverlässigkeit (Pünktlichkeit, Teilnahme)
// - Sessions gespielt
// - Bewertungen durch andere

export function calculateRankingScore(user) {
  const mvpWeight = 25
  const highFiveWeight = 15
  const reliabilityWeight = 30
  const volumeWeight = 10
  const ratingWeight = 20
  
  const score = 
    (user.mvp_count * 5) * mvpWeight +
    (user.high_fives_received * 3) * highFiveWeight +
    (user.reliability_score) * reliabilityWeight +
    Math.min(user.sessions_played, 100) * volumeWeight +
    (user.avg_rating * 20) * ratingWeight
    
  return Math.round(score)
}

// Gruppiere Nutzer in Tiers: Bronze, Silber, Gold, Platin
export function getTierFromScore(score) {
  if (score >= 5000) return { name: 'Platin', color: '#60A5FA', icon: '👑' }
  if (score >= 3000) return { name: 'Gold', color: '#FCD34D', icon: '🥇' }
  if (score >= 1500) return { name: 'Silber', color: '#D1D5DB', icon: '🥈' }
  return { name: 'Bronze', color: '#D97706', icon: '🥉' }
}
```

#### 2.2 Neue Seite: `src/pages/Ranking.jsx`
- Zeigt globales Leaderboard
- Filter nach: Sport, Stadt, Fähigkeitslevel
- Zeigt deinen persönlichen Rank & Tier
- Vergleiche dich mit Freunden

#### 2.3 Ranking-Komponente: `src/components/RankingLeaderboard.jsx`
- Liste aller Nutzer sortiert nach Score
- Mit Rang, Avatar, Name, Score, Trend
- "Freund hinzufügen" Button
- Top 10 / Top 50 / Alle views

#### 2.4 Ranking-Display in SessionDetail
**Datei**: `src/pages/SessionDetail.jsx`
- Zeige Rang/Tier von anderen Teilnehmern
- Nutzer sehen wer "besser" oder "schlechter" ist
- Hilft beim Matchmaking-Verständnis

#### 2.5 RPC Funktion zum Ranking abrufen
```sql
CREATE OR REPLACE FUNCTION public.get_user_ranking(p_user_id UUID, p_sport TEXT DEFAULT NULL)
RETURNS TABLE(
  rank INT,
  user_id UUID,
  name TEXT,
  score INT,
  tier TEXT,
  mvp_count INT,
  reliability_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY calculate_ranking_score(u) DESC) as rank,
    u.id,
    u.name,
    calculate_ranking_score(u)::INT as score,
    get_tier_from_score(calculate_ranking_score(u)) as tier,
    u.mvp_count,
    u.reliability_score
  FROM public.users u
  WHERE p_sport IS NULL OR p_sport = ANY(u.sports)
  ORDER BY score DESC;
END;
$$ LANGUAGE plpgsql;
```

---

## Feature 3: Platzbuchung

### Zweck
Nutzer buchen Sportplätze direkt aus der App heraus. Sportis verdient Provisionen.

### Bestehende Komponenten
- ✅ `Plaetze.jsx` - Zeigt verfügbare Plätze auf Karte
- ✅ `courts` Tabelle mit Platzinfo
- ✅ OpenStreetMap Integration

### Zu implementieren

#### 3.1 Datenbank-Schema für Buchungen
**Datei**: `supabase-schema.sql`
```sql
-- Neue Tabelle für Platz-Partner (Partner-Plätze mit Buchungs-System)
CREATE TABLE public.court_partners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  api_key TEXT NOT NULL,  -- für externe Booking-API
  commission_rate FLOAT DEFAULT 0.15,  -- 15% Provision
  created_at TIMESTAMP DEFAULT NOW()
);

-- Buchungs-Tabelle
CREATE TABLE public.court_bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id),
  court_id UUID REFERENCES public.courts(id),
  partner_booking_id TEXT,  -- externe Booking-ID vom Partner
  session_id UUID REFERENCES public.sessions(id),
  date DATE NOT NULL,
  time_from TIME NOT NULL,
  time_to TIME NOT NULL,
  duration_minutes INT,
  court_name TEXT NOT NULL,
  court_address TEXT,
  price_cents INT,  -- Preis in Cent
  currency TEXT DEFAULT 'EUR',
  status TEXT DEFAULT 'confirmed',  -- 'pending', 'confirmed', 'cancelled'
  partner_id UUID REFERENCES public.court_partners(id),
  booking_url TEXT,  -- Link zum Platz-Partner
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Provisioning-Tracking
CREATE TABLE public.earnings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES public.court_bookings(id),
  commission_amount_cents INT,  -- Provision in Cent
  status TEXT DEFAULT 'pending',  -- 'pending', 'paid', 'failed'
  partner_id UUID REFERENCES public.court_partners(id),
  calculated_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP
);
```

#### 3.2 Booking-Integration (Partner-APIs)
**Neue Datei**: `src/lib/bookingAPI.js`
```javascript
// Integration mit Court-Booking-Partnern (z.B. Platzreservierungssysteme)
// Beispiele: ReservationHero, SimpleBooking, eigene APIs

export const BOOKING_PARTNERS = [
  {
    name: 'ReservationHero',
    baseUrl: 'https://api.reservationhero.com',
    description: 'Tennisplätze, Multisportanlagen'
  },
  // weitere Partner...
]

export async function searchCourtBooking(court, date, timeFrom, timeTo) {
  // Rufe Partner-API auf um Verfügbarkeit zu prüfen
  // Gib Preis zurück
}

export async function bookCourt(courtId, date, timeFrom, timeTo, userId) {
  // Buche Platz über Partner-API
  // Speichere Buchung in DB
  // Berechne Provision
}
```

#### 3.3 Buchungs-UI in `Plaetze.jsx`
- Neuer Tab: "Platzreservierung"
- Wähle Sportplatz aus der Karte
- Datum/Uhrzeit auswählen
- Verfügbarkeit & Preis anzeigen
- "Jetzt buchen" Button
- Redirect zu Partner-Website oder In-App-Buchung

#### 3.4 Neue Komponente: `src/components/CourtBooking.jsx`
- Modal/Form für Platzbuchung
- Integration mit Partner-APIs
- Payment-Integration (Stripe, PayPal, etc.)
- Bestätigungsemail

#### 3.5 Admin-Dashboard für Provisionen
**Neue Datei**: `src/pages/Admin/Earnings.jsx` (nur für Admins)
- Zeige alle Buchungen
- Verdiente Provisionen
- Auszahlungsstatus
- Export für Buchhaltung

#### 3.6 Neue Route in App.jsx
```javascript
import CourtBooking from './pages/Admin/Earnings'  // Provisionsübersicht

<Route path="/admin/earnings" element={<AdminLayout><Earnings /></AdminLayout>} />
```

---

## Implementierungs-Roadmap

### Phase 1: Score-Tracking (1-2 Wochen)
1. DB-Schema erweitern
2. `ScoreTracker.jsx` komponente bauen
3. `Profil.jsx` erweitern mit Statistik-Tab
4. RPC-Funktionen für Score-Updates

### Phase 2: Ranking (1-2 Wochen)
1. Ranking-Algorithmus implementieren
2. `Ranking.jsx` Seite bauen
3. `RankingLeaderboard.jsx` komponente
4. SessionDetail mit Rank-Display aktualisieren
5. RPC Ranking-Funktion erstellen

### Phase 3: Platzbuchung (2-4 Wochen)
1. Partner-API Recherche & Integration
2. DB-Schema für Buchungen
3. `CourtBooking.jsx` komponente
4. Payment-Integration
5. Admin-Dashboard für Provisionen

---

## Daten-Fluss Diagramm

```
SESSION BEENDET
    ↓
PostGameVoting (MVP, High Fives)
    ↓
finalize_session_scores() (RPC)
    ↓
Users-Tabelle aktualisiert
(mvp_count, high_fives_received, sessions_played)
    ↓
calculate_ranking_score() (RPC)
    ↓
Leaderboard neu berechnet
    ↓
Nutzer sieht neuen Rank in Profil & Leaderboard
```

---

## Monetarisierungs-Strategie

### Score-Tracking & Ranking
- **Kostenlos** für alle (Community-Feature)
- Später: Premium-Features wie "Advanced Analytics", "Training Plans"

### Platzbuchung
- **Sportis-Provision**: 15-20% pro Buchung
- **Partner-Gebühren**: Vom Partner abhängig
- **Payment-Gebühren**: Stripe/PayPal Gebühren

---

## API-Partner-Optionen

1. **ReservationHero** - Tennis, Multisport
2. **SimpleBooking** - allgemein
3. **Direktintegration** mit lokalen Platz-Betreibern
4. **Google Places API** - für Verifizierung von Platzinfo

---

## Technische Requirements

### Dependencies (möglicherweise zu installieren)
```bash
npm install recharts  # für Score-Grafiken
npm install axios     # für Booking-APIs
npm install stripe    # für Payments (später)
```

### Browser-APIs
- LocalStorage für Caching von Rankings
- IndexedDB für historische Score-Daten

---

## KPIs zum Messen des Erfolgs

### Score-Tracking
- ✅ Nutzer kehren 2x pro Woche zurück (+ Retention)
- ✅ 70%+ sehen ihre Statistiken
- ✅ Avg. 3+ Minuten auf Profil/Stats-Seite

### Ranking
- ✅ 60%+ nutzen Ranking zum Matchmaking
- ✅ bessere Session-Zufriedenheit (Rating steigt)
- ✅ Sessions werden gezielter gefiltert nach Skill-Level

### Platzbuchung
- ✅ 10%+ aller Session-Ersteller buchen Platz über App
- ✅ Avg. €50+ pro Buchung × 15% Provision
- ✅ 20%+ Monatlicher Revenue-Growth

---

## Nächste Schritte
1. **DB-Migrations** durchführen
2. **Score-Tracking** als erstes Feature bauen
3. **Ranking** dann darauf aufbauen
4. **Platzbuchung** mit echten Partnern testen

