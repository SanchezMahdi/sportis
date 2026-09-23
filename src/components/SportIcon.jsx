import { SPORT_EMOJIS, toSportLabel } from '../lib/constants'

export default function SportIcon({ sport, showName = true, size = 'md' }) {
  const sportLabel = toSportLabel(sport)
  const emoji = SPORT_EMOJIS[sportLabel] || '🏃'

  const sizes = {
    sm: { emoji: 'text-sm', text: 'text-xs' },
    md: { emoji: 'text-xl', text: 'text-sm' },
    lg: { emoji: 'text-3xl', text: 'text-base' },
    xl: { emoji: 'text-5xl', text: 'text-lg' },
  }

  const { emoji: emojiSize, text: textSize } = sizes[size] || sizes.md

  return (
    <span className="inline-flex items-center gap-1">
      <span className={emojiSize} role="img" aria-label={sportLabel}>
        {emoji}
      </span>
      {showName && (
        <span className={`${textSize} font-medium`}>{sportLabel}</span>
      )}
    </span>
  )
}
