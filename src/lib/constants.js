export const SPORTARTEN = [
  'Fußball',
  'Volleyball',
  'Basketball',
  'Tennis',
  'Tischtennis',
]

export const SKILL_LEVELS = ['Anfänger', 'Mittel', 'Fortgeschritten']

export const GENDER_FILTERS = ['Gemischt', 'Nur Frauen', 'Nur Männer']

export const SPORT_EMOJIS = {
  Fußball: '⚽',
  Fussball: '⚽',
  football: '⚽',
  soccer: '⚽',
  Volleyball: '🏐',
  Vollyball: '🏐',
  volleyball: '🏐',
  Basketball: '🏀',
  basketball: '🏀',
  Tennis: '🎾',
  tennis: '🎾',
  Tischtennis: '🏓',
  table_tennis: '🏓',
  Chillen: '😎',
  chillen: '😎',
  Laufen: '🏃',
  Joggen: '🏃',
  Padel: '🎾',
  Gym: '💪',
  Fitness: '🏋️',
  Yoga: '🧘',
  Bouldern: '🧗',
}

export const SPORT_IMAGES = {
  Fußball: '/sports/hallen_futsal.png',
  Volleyball: '/sports/vollyball.png',
  Basketball: '/sports/baskettball.png',
  Tennis: '/sports/tennis.png',
  Tischtennis: '/sports/tischtenis.png',
}

export const SKILL_COLORS = {
  Anfänger: 'bg-blue-500',
  Mittel: 'bg-yellow-500',
  Fortgeschritten: 'bg-red-500',
}

export const SKILL_TEXT_COLORS = {
  Anfänger: 'text-blue-400',
  Mittel: 'text-yellow-400',
  Fortgeschritten: 'text-red-400',
}

export const GENDER_ICONS = {
  Gemischt: '⚥',
  'Nur Frauen': '♀',
  'Nur Männer': '♂',
}

export const VALID_SPORT_ENUMS = [
  'football',
  'basketball',
  'volleyball',
  'tennis',
  'table_tennis',
  'padel',
  'running',
  'cycling',
  'badminton',
  'other',
]

export const SPORT_DB_VALUES = {
  Fußball: 'football',
  Fussball: 'football',
  football: 'football',
  soccer: 'football',
  Soccer: 'football',
  Volleyball: 'volleyball',
  volleyball: 'volleyball',
  Vollyball: 'volleyball',
  Basketball: 'basketball',
  basketball: 'basketball',
  Tennis: 'tennis',
  tennis: 'tennis',
  Tischtennis: 'table_tennis',
  'Table Tennis': 'table_tennis',
  table_tennis: 'table_tennis',
  Padel: 'padel',
  padel: 'padel',
  Laufen: 'running',
  Running: 'running',
  running: 'running',
  Joggen: 'running',
  Radfahren: 'cycling',
  Cycling: 'cycling',
  cycling: 'cycling',
  Badminton: 'badminton',
  badminton: 'badminton',
  Sonstiges: 'other',
  other: 'other',
}

export const SPORT_LABELS = {
  football: 'Fußball',
  basketball: 'Basketball',
  volleyball: 'Volleyball',
  tennis: 'Tennis',
  table_tennis: 'Tischtennis',
  padel: 'Padel',
  running: 'Laufen',
  cycling: 'Radfahren',
  badminton: 'Badminton',
  other: 'Sonstiges',
}

export const SKILL_DB_VALUES = {
  Anfänger: 'beginner',
  Mittel: 'intermediate',
  Fortgeschritten: 'advanced',
}

export const SKILL_LABELS = {
  beginner: 'Anfänger',
  intermediate: 'Mittel',
  advanced: 'Fortgeschritten',
}

export function toSportDbValue(sport) {
  if (!sport) return 'other'
  const raw = String(sport).trim()
  if (SPORT_DB_VALUES[raw]) return SPORT_DB_VALUES[raw]
  const s = raw.toLowerCase()
  if (SPORT_DB_VALUES[s]) return SPORT_DB_VALUES[s]
  if (VALID_SPORT_ENUMS.includes(s)) return s

  if (s.includes('fuss') || s.includes('fuß') || s.includes('foot') || s.includes('soccer') || s.includes('bolzen') || s.includes('kicken')) {
    return 'football'
  }
  if (s.includes('basket') || s.includes('bball')) {
    return 'basketball'
  }
  if (s.includes('voll') || s.includes('beach')) {
    return 'volleyball'
  }
  if (s.includes('tischtennis') || s.includes('ping') || s.includes('table')) {
    return 'table_tennis'
  }
  if (s.includes('tennis')) {
    return 'tennis'
  }
  if (s.includes('padel')) {
    return 'padel'
  }
  if (s.includes('lauf') || s.includes('jogg') || s.includes('run')) {
    return 'running'
  }
  if (s.includes('rad') || s.includes('bike') || s.includes('cycl')) {
    return 'cycling'
  }
  if (s.includes('badminton') || s.includes('federball')) {
    return 'badminton'
  }

  // Any other sport or free text (e.g. "Chillen", "Gym", "Yoga", "Bouldern")
  // maps safely to 'other' so Postgres enum constraint is never violated
  return 'other'
}

export function toSportLabel(sport) {
  if (!sport) return 'Sport'
  return SPORT_LABELS[sport] || (SPORT_DB_VALUES[sport] ? SPORT_LABELS[SPORT_DB_VALUES[sport]] : sport)
}

export function toSkillDbValue(level) {
  if (!level) return 'intermediate'
  const l = String(level).trim().toLowerCase()
  if (l === 'beginner' || l === 'intermediate' || l === 'advanced') return l
  if (l.includes('anf') || l.includes('beg')) return 'beginner'
  if (l.includes('fort') || l.includes('adv') || l.includes('prof')) return 'advanced'
  return 'intermediate'
}

export function toSkillLabel(level) {
  return SKILL_LABELS[level] || level
}
