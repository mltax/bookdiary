import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ReadingRecord } from '@/lib/supabase/types'
import { STATUS_LABELS } from '@/lib/constants'

const STATUS_VARIANT = {
  reading: 'default',
  completed: 'secondary',
  dropped: 'outline',
} as const

interface Props {
  record: ReadingRecord & { book: { title: string; author: string; cover_image_url: string | null } }
}

export function BookCard({ record }: Props) {
  return (
    <Link href={`/books/${record.id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="flex gap-3 p-3">
          {record.book.cover_image_url && (
            <Image
              src={record.book.cover_image_url}
              alt={record.book.title}
              width={50}
              height={67}
              className="object-cover rounded flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm leading-tight line-clamp-2">{record.book.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{record.book.author}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={STATUS_VARIANT[record.status]} className="text-xs">
                {STATUS_LABELS[record.status]}
              </Badge>
              {record.star_rating && (
                <span className="text-xs text-yellow-500">{'★'.repeat(record.star_rating)}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
