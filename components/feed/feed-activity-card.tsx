import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { FeedActivity } from '@/lib/supabase/types'
import { ACTIVITY_LABELS } from '@/lib/constants'

interface Props {
  activity: FeedActivity
}

export function FeedActivityCard({ activity }: Props) {
  const { user, record } = activity
  const book = record?.book

  if (!user || !record || !book) return null

  const activityLabel = ACTIVITY_LABELS[activity.activity_type]
  const date = new Date(activity.created_at).toLocaleDateString('ko-KR')

  return (
    <Link href={`/books/${activity.record_id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="flex gap-3 p-3">
          {book.cover_image_url && (
            <Image
              src={book.cover_image_url}
              alt={book.title}
              width={50}
              height={67}
              className="object-cover rounded flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">{user.nickname}</span>
              <Badge variant="outline" className="text-xs">{activityLabel}</Badge>
            </div>
            <p className="text-sm font-medium line-clamp-1">{book.title}</p>
            <p className="text-xs text-muted-foreground">{book.author}</p>
            {record.star_rating && activity.activity_type === 'completed' && (
              <span className="text-xs text-yellow-500">{'★'.repeat(record.star_rating)}</span>
            )}
            <p className="text-xs text-muted-foreground mt-1">{date}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
