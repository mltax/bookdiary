import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogoutButton } from '@/components/auth/logout-button'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: records } = await supabase
    .from('reading_records')
    .select('status, created_at')
    .eq('user_id', user.id)

  const stats = (records ?? []).reduce(
    (acc, r) => {
      acc[r.status as 'reading' | 'completed' | 'dropped']++
      return acc
    },
    { reading: 0, completed: 0, dropped: 0 }
  )

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">내 프로필</h1>

      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xl">{profile?.nickname?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold text-lg">{profile?.nickname}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">독서 통계</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{stats.reading}</p>
            <p className="text-xs text-muted-foreground">읽는 중</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">완독</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-muted-foreground">{stats.dropped}</p>
            <p className="text-xs text-muted-foreground">포기</p>
          </div>
        </CardContent>
      </Card>

      <LogoutButton />
    </div>
  )
}
