import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FeedActivityCard } from '@/components/feed/feed-activity-card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: activities } = await supabase
    .from('feed_activities')
    .select(`
      *,
      user:users(nickname, avatar_url),
      record:reading_records(
        *,
        book:books(title, author, cover_image_url)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(30)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">가족 피드</h1>
        <Button size="sm" nativeButton={false} render={<Link href="/search" />}>+ 책 추가</Button>
      </div>

      {!activities || activities.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-muted-foreground">아직 독서 기록이 없어요.</p>
          <Button nativeButton={false} render={<Link href="/search" />}>첫 번째 책을 기록해보세요</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map(activity => (
            <FeedActivityCard key={activity.id} activity={activity as any} />
          ))}
        </div>
      )}
    </div>
  )
}
