import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { STATUS_LABELS } from '@/lib/constants'

interface Props {
  params: Promise<{ id: string }>
}

export default async function RecordDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: record } = await supabase
    .from('reading_records')
    .select('*, book:books(*), user:users(nickname, avatar_url)')
    .eq('id', id)
    .single()

  if (!record) notFound()

  const isOwner = record.user_id === user.id
  const isFinished = record.status === 'completed' || record.status === 'dropped'

  return (
    <div className="space-y-4">
      {/* 책 헤더 */}
      <div className="flex gap-4">
        {record.book.cover_image_url && (
          <Image
            src={record.book.cover_image_url}
            alt={record.book.title}
            width={80}
            height={107}
            className="object-cover rounded shadow"
          />
        )}
        <div className="flex-1">
          <h1 className="font-bold text-lg leading-tight">{record.book.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{record.book.author}</p>
          {record.book.publisher && (
            <p className="text-xs text-muted-foreground">{record.book.publisher}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge>{STATUS_LABELS[record.status]}</Badge>
            {record.star_rating && (
              <span className="text-yellow-500 text-sm">{'★'.repeat(record.star_rating)}{'☆'.repeat(5 - record.star_rating)}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            기록자: {record.user?.nickname}
          </p>
        </div>
      </div>

      <Separator />

      {/* 기대감 vs 소감 비교 */}
      <div className="grid gap-3">
        {record.expected_feeling && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">📖 읽기 전 기대감</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{record.expected_feeling}</p>
            </CardContent>
          </Card>
        )}
        {isFinished && record.actual_feeling && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">✅ 읽은 후 소감</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{record.actual_feeling}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 감정 태그 */}
      {record.emotion_tags?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {record.emotion_tags.map((tag: string) => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          ))}
        </div>
      )}

      {/* 날짜 정보 */}
      <div className="text-xs text-muted-foreground space-y-1">
        {record.started_at && <p>시작일: {record.started_at}</p>}
        {record.finished_at && <p>완료일: {record.finished_at}</p>}
      </div>

      {/* 수정 버튼 (본인만) */}
      {isOwner && (
        <Button variant="outline" className="w-full" render={<Link href={`/books/${id}/edit`} />}>
          기록 수정
        </Button>
      )}
    </div>
  )
}
