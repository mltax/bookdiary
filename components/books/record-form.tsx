'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ReadingRecord, Book } from '@/lib/supabase/types'
import { STATUS_LABELS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EmotionTagSelector } from './emotion-tag-selector'
import Image from 'next/image'

type Status = 'reading' | 'completed' | 'dropped'

interface Props {
  book: Book
  existingRecord?: ReadingRecord
  userId: string
}

export function RecordForm({ book, existingRecord, userId }: Props) {
  const [status, setStatus] = useState<Status>(existingRecord?.status ?? 'reading')
  const [expectedFeeling, setExpectedFeeling] = useState(existingRecord?.expected_feeling ?? '')
  const [actualFeeling, setActualFeeling] = useState(existingRecord?.actual_feeling ?? '')
  const [emotionTags, setEmotionTags] = useState<string[]>(existingRecord?.emotion_tags ?? [])
  const [starRating, setStarRating] = useState<number>(existingRecord?.star_rating ?? 0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const isFinished = status === 'completed' || status === 'dropped'
  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const supabase = createClient()

    const payload = {
      user_id: userId,
      book_id: book.id,
      status,
      expected_feeling: expectedFeeling || null,
      actual_feeling: isFinished ? (actualFeeling || null) : null,
      emotion_tags: isFinished ? emotionTags : [],
      star_rating: status === 'completed' && starRating > 0 ? starRating : null,
      // 최초 시작일은 보존하고, 새로 기록할 때만 오늘 날짜로 설정한다.
      started_at: existingRecord?.started_at ?? today,
      // 이미 완료/포기한 기록이면 기존 완료일을 유지한다.
      finished_at: isFinished ? (existingRecord?.finished_at ?? today) : null,
    }

    let recordId: string

    if (existingRecord) {
      const { data, error } = await supabase
        .from('reading_records')
        .update(payload)
        .eq('id', existingRecord.id)
        .select('id')
        .single()
      if (error || !data) {
        setError('기록 저장에 실패했습니다. 다시 시도해 주세요.')
        setSaving(false)
        return
      }
      recordId = data.id
    } else {
      const { data, error } = await supabase
        .from('reading_records')
        .insert(payload)
        .select('id')
        .single()
      if (error || !data) {
        setError('기록 저장에 실패했습니다. 다시 시도해 주세요.')
        setSaving(false)
        return
      }
      recordId = data.id
    }

    // 피드 활동 생성
    const activityType = status === 'reading' ? 'started' : status
    const shouldCreateFeed = !existingRecord || existingRecord.status !== status
    if (shouldCreateFeed) {
      await supabase.from('feed_activities').insert({
        user_id: userId,
        record_id: recordId,
        activity_type: activityType,
      })
    }

    router.push(`/books/${recordId}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 책 정보 표시 */}
      <div className="flex gap-3 p-3 bg-muted rounded-lg">
        {book.cover_image_url && (
          <Image src={book.cover_image_url} alt={book.title} width={50} height={67} className="object-cover rounded" />
        )}
        <div>
          <p className="font-medium text-sm">{book.title}</p>
          <p className="text-xs text-muted-foreground">{book.author}</p>
        </div>
      </div>

      {/* 독서 상태 */}
      <div className="space-y-2">
        <Label>독서 상태</Label>
        <div className="flex gap-2">
          {(['reading', 'completed', 'dropped'] as Status[]).map(s => (
            <Button
              key={s}
              type="button"
              variant={status === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatus(s)}
            >
              {STATUS_LABELS[s]}
            </Button>
          ))}
        </div>
      </div>

      {/* 읽기 전 기대감 */}
      <div className="space-y-2">
        <Label htmlFor="expected">읽기 전 기대감 (선택)</Label>
        <Textarea
          id="expected"
          value={expectedFeeling}
          onChange={e => setExpectedFeeling(e.target.value)}
          placeholder="이 책에 어떤 기대를 가지고 있나요?"
          rows={3}
        />
      </div>

      {/* 완독/포기 시 추가 필드 */}
      {isFinished && (
        <>
          {status === 'completed' && (
            <div className="space-y-2">
              <Label>별점</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setStarRating(n)}
                    className={`text-2xl transition-colors ${n <= starRating ? 'text-yellow-400' : 'text-muted-foreground'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>감정 태그</Label>
            <EmotionTagSelector selected={emotionTags} onChange={setEmotionTags} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="actual">읽은 후 소감</Label>
            <Textarea
              id="actual"
              value={actualFeeling}
              onChange={e => setActualFeeling(e.target.value)}
              placeholder="읽고 나서 어떠셨나요?"
              rows={4}
            />
          </div>
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? '저장 중...' : existingRecord ? '수정하기' : '기록 저장'}
      </Button>
    </form>
  )
}
