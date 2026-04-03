import { SPORT_EMOJIS } from '../lib/constants'

export default function SportIcon({ sport, showName = true, size = 'md' }) {
  const emoji = SPORT_EMOJIS[sport] || '🏃'

  const sizes = {
    sm: { emoji: 'text-sm', text: 'text-xs' },
    md: { emoji: 'text-xl', text: 'text-sm' },
    lg: { emoji: 'text-3xl', text: 'text-base' },
    xl: { emoji: 'text-5xl', text: 'text-lg' },
  }

  const { emoji: emojiSize, text: textSize } = sizes[size] || sizes.md

  return (
    <span className="inline-flex items-center gap-1">
      <span className={emojiSize} role="img" aria-label={sport}>
        {emoji}
      </span>
      {showName && (
        <span className={`${textSize} font-medium`}>{sport}</span>
      )}
    </span>
  )
}
