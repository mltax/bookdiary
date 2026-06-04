'use client'
import { EMOTION_TAGS, type EmotionTag } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'

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
          variant={selected.includes(tag) ? 'default' : 'outline'}
          className="cursor-pointer select-none"
          onClick={() => toggle(tag)}
        >
          {tag}
        </Badge>
      ))}
    </div>
  )
}
