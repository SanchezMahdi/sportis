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
  Volleyball: '🏐',
  Basketball: '🏀',
  Tennis: '🎾',
  Tischtennis: '🏓',
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

export const SPORT_DB_VALUES = {
  Fußball: 'football',
  Volleyball: 'volleyball',
  Basketball: 'basketball',
  Tennis: 'tennis',
  Tischtennis: 'table_tennis',
}

export const SPORT_LABELS = Object.fromEntries(
  Object.entries(SPORT_DB_VALUES).map(([label, dbValue]) => [dbValue, label])
)

export const SKILL_DB_VALUES = {
  Anfänger: 'beginner',
  Mittel: 'intermediate',
  Fortgeschritten: 'advanced',
}

export const SKILL_LABELS = Object.fromEntries(
  Object.entries(SKILL_DB_VALUES).map(([label, dbValue]) => [dbValue, label])
)

export function toSportDbValue(sport) {
  return SPORT_DB_VALUES[sport] || sport
}

export function toSportLabel(sport) {
  return SPORT_LABELS[sport] || sport
}

export function toSkillDbValue(level) {
  return SKILL_DB_VALUES[level] || level
}

export function toSkillLabel(level) {
  return SKILL_LABELS[level] || level
}
