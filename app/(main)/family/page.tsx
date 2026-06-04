import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default async function FamilyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: members } = await supabase
    .from('users')
    .select('id, nickname, avatar_url, created_at')
    .order('created_at')

  // 각 멤버의 상태별 기록 수 집계
  const { data: stats } = await supabase
    .from('reading_records')
    .select('user_id, status')

  const statsByUser = (stats ?? []).reduce<Record<string, { reading: number; completed: number; dropped: number }>>(
    (acc, r) => {
      if (!acc[r.user_id]) acc[r.user_id] = { reading: 0, completed: 0, dropped: 0 }
      acc[r.user_id][r.status as 'reading' | 'completed' | 'dropped']++
      return acc
    },
    {}
  )

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">가족 멤버</h1>
      <div className="space-y-3">
        {members?.map(member => {
          const s = statsByUser[member.id] ?? { reading: 0, completed: 0, dropped: 0 }
          return (
            <Card key={member.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <Avatar>
                  <AvatarImage src={member.avatar_url ?? undefined} />
                  <AvatarFallback>{member.nickname[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{member.nickname}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                    <span>읽는 중 {s.reading}</span>
                    <span>완독 {s.completed}</span>
                    <span>포기 {s.dropped}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
