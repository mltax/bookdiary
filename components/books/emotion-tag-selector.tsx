'use client'
import { EMOTION_TAGS, EMOTION_COLORS, type EmotionTag } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Props {
  selected: string[]
  onChange: (tags: string[]) => void
}

export function EmotionTagSelector({ selected, onChange }: Props) {
  function toggle(tag: EmotionTag) {
    onChange(
      selected.includes(tag)
        ? selected.filter(t => t !== tag)
        : [...selected, tag]
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {EMOTION_TAGS.map(tag => (
        <Badge
          key={tag}
          variant="outline"
          className={cn(
            'cursor-pointer select-none border transition-colors',
            selected.includes(tag)
              ? EMOTION_COLORS[tag]
              : 'hover:bg-muted hover:text-muted-foreground'
          )}
          onClick={() => toggle(tag)}
        >
          {tag}
        </Badge>
      ))}
    </div>
  )
}
