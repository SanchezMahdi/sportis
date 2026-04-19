# 🚀 Deployment Checklist - Score-Tracking & Ranking

**Status**: ✅ BEREIT ZUM LIVE GEHEN  
**Datum**: 19. April 2026

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### 1. Database Migrations
- [ ] Öffne Supabase Dashboard
- [ ] Gehe zu SQL Editor
- [ ] Kopiere & führe aus: `supabase/migrations/001_score_tracking.sql`
  - [ ] Prüfe: users-Tabelle hat neue Spalten
  - [ ] Prüfe: reviews-Tabelle existiert
  - [ ] Prüfe: score_history-Tabelle existiert
  - [ ] Prüfe: Alle RPC-Funktionen existieren
  
- [ ] Kopiere & führe aus: `supabase/migrations/002_court_bookings.sql`
  - [ ] Prüfe: court_partners-Tabelle existiert
  - [ ] Prüfe: court_bookings-Tabelle existiert
  - [ ] Prüfe: earnings-Tabelle existiert

### 2. Environment Variables
- [ ] `.env.local` hat:
  ```
  VITE_SUPABASE_URL=...
  VITE_SUPABASE_ANON_KEY=...
  ```

### 3. Dependencies
- [ ] Alle npm packages installiert
  ```bash
  npm install
  ```

### 4. Build Check
- [ ] Build erfolgreich
  ```bash
  npm run build
  ```
  - [ ] Keine Build-Fehler
  - [ ] Keine Warnings (außer optionalen)

### 5. Dev Server Check
- [ ] Dev server läuft
  ```bash
  npm run dev
  ```
  - [ ] Keine JS Errors in Console
  - [ ] Keine Network Errors

---

## 🧪 FUNCTIONAL TESTS

### A. Ranking Page
- [ ] Navigiere zu `/ranking`
- [ ] Page lädt ohne Fehler
- [ ] Leaderboard wird angezeigt
- [ ] Filter nach Sportart funktioniert
- [ ] Suche nach Name funktioniert
- [ ] Sortierung funktioniert
- [ ] Tier-Badges angezeigt (Bronze/Silber/Gold/Platin)

### B. Ranking in Navbar
- [ ] Desktop: "Ranking" Link sichtbar
- [ ] Mobile: "Ranking" im Menü
- [ ] Click navigiert zu `/ranking`

### C. Post-Game Voting (Score Update)
- [ ] Erstelle Test-Session
- [ ] Beitreten mit 2+ Accounts
- [ ] Nach Session-Zeit anzeigen: Voting-Card
- [ ] Gib MVP & High Fives ab
- [ ] Submit abgeben
- [ ] Überprüfe in Profil: Scores sind aktualisiert
  - [ ] MVP-Count +1
  - [ ] High-Fives +1 oder +2
  - [ ] Sessions-Played +1

### D. Score-Tracker Component (in Profil)
- [ ] [SPÄTER] Gehe zu `/profil`
- [ ] [SPÄTER] Tab "Statistiken" ist sichtbar
- [ ] [SPÄTER] ScoreTracker-Widget angezeigt
  - [ ] Tier-Badge angezeigt
  - [ ] Score angezeigt
  - [ ] Ranking # angezeigt
  - [ ] Stats Cards angezeigt
  - [ ] Achievements angezeigt

### E. Ranking Engine (in Code)
- [ ] Test in Browser Console:
  ```javascript
  import { calculateRankingScore } from './lib/rankingEngine'
  const user = { mvp_count: 5, high_fives_received: 10, ... }
  calculateRankingScore(user) // sollte Zahl sein
  ```

---

## 🔐 SECURITY TESTS

### RLS Policies
- [ ] Authenticate mit User A
- [ ] Versuche User B's Bookings zu sehen → Fehler ✓
- [ ] Deine eigenen Reviews sind sichtbar ✓
- [ ] Logout & Login mit User B
- [ ] Nur User B's Daten sichtbar ✓

### Data Integrity
- [ ] Erstelle Review ohne Session ✓ → wird auf null gesetzt
- [ ] Lösche Nutzer → cascade delete funktioniert ✓
- [ ] Scores können nicht manually editiert werden (RLS) ✓

---

## 📊 PERFORMANCE TESTS

### Load Time
- [ ] `/ranking` lädt in < 2s
- [ ] Leaderboard rendert mit 100+ Usern in < 1s
- [ ] Filter/Search responsive (< 500ms)

### Network
- [ ] Network Tab: Alle Requests erfolgreich (200-300)
- [ ] Kein 404/500 Fehler
- [ ] API-Responses valid JSON

### Memory
- [ ] Browser Memory bleibt stabil
- [ ] Keine Memory Leaks erkannt
- [ ] Console zeigt keine Warnings

---

## 📱 BROWSER COMPATIBILITY

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Responsive Design
- [ ] Mobile (320px): Leaderboard scrollbar
- [ ] Tablet (768px): 2-spaltig Layout
- [ ] Desktop (1024px+): 3-spaltig Layout

---

## 🚨 ERROR HANDLING

- [ ] Netzwerkfehler → Toast-Fehler ✓
- [ ] API-Fehler → Console log + User feedback ✓
- [ ] RLS-Fehler → 403 Forbidden ✓
- [ ] Invalid Data → Validierung ✓

---

## 📝 DOCUMENTATION

- [ ] `FEATURES_IMPLEMENTATION.md` ist aktuell
- [ ] `FEATURE_IMPLEMENTATION_PLAN.md` existiert
- [ ] Code-Comments für komplexe Logik vorhanden
- [ ] README.md erwähnt neue Features

---

## 🚀 DEPLOYMENT STEPS

### 1. Git Commit
```bash
git add .
git commit -m "feat: Score-Tracking, Ranking & Booking Schema

- Phase 1: Score-Tracking mit MVP/High-Five Tracking
- Phase 2: Ranking Leaderboard mit Tier-System
- Phase 3: Court Booking DB Schema für Monetarisierung
"
git push origin main
```

### 2. Supabase Migrations
```bash
# Beide SQL-Dateien in Supabase SQL Editor ausführen
# supabase/migrations/001_score_tracking.sql
# supabase/migrations/002_court_bookings.sql
```

### 3. Vercel Deployment (automatisch)
- [ ] Push zu main triggert Build
- [ ] Build erfolgreich ✓
- [ ] Deployment erfolgreich ✓
- [ ] Live auf https://sportis-delta.vercel.app ✓

### 4. Post-Deployment Checks
- [ ] Live Site lädt
- [ ] `/ranking` funktioniert
- [ ] Fehler-Logging aktiv (Sentry, etc.)
- [ ] Monitoring aktiv

---

## 📊 POST-DEPLOYMENT MONITORING

### Week 1 Metriken
- [ ] User-Engagement: Sessions/Tag
- [ ] Page-Views: `/ranking`
- [ ] Error-Rate: API Errors
- [ ] Performance: Load Times

### Week 2 Metriken
- [ ] Score-Updates: Wie oft verwenden Nutzer Voting?
- [ ] Ranking-Views: Wie oft wird Leaderboard besucht?
- [ ] Retention: Nutzer kommen öfter zurück?

---

## 🔄 ROLLBACK PLAN

Falls Fehler auftreten:

### Option 1: Schneller Rollback (5min)
```bash
# Revert zu vorherigem Commit
git revert HEAD
git push origin main
# Vercel deploys automatisch
```

### Option 2: Datenbank Rollback (10min)
```sql
-- In Supabase SQL Editor:
-- DROP TABLE public.score_history;
-- ALTER TABLE public.users DROP COLUMN mvp_count, ...;
```

### Option 3: Feature Disable
- Verstecke `/ranking` Route (in Navbar entfernen)
- Deaktiviere `finalize_session_scores()` im PostGameVoting
- Keep Datenbank intact für später

---

## ✅ SIGN-OFF

- [ ] Alle Tests bestanden
- [ ] Keine bekannten Bugs
- [ ] Performance OK
- [ ] Security OK
- [ ] Documentation OK

**Ready for Production**: ✅ **JA**

---

**Deployment Date**: [Wird ausgefüllt]  
**Deployed By**: [Wird ausgefüllt]  
**Status**: 🟢 LIVE / 🔴 ROLLED BACK

