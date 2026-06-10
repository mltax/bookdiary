import { createClient, getCachedUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BookCard } from '@/components/books/book-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function BooksPage() {
  const user = await getCachedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const { data: records } = await supabase
    .from('reading_records')
    .select('*, book:books(title, author, cover_image_url)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const byStatus = {
    reading: records?.filter(r => r.status === 'reading') ?? [],
    completed: records?.filter(r => r.status === 'completed') ?? [],
    dropped: records?.filter(r => r.status === 'dropped') ?? [],
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">내 독서 목록</h1>
        <Button size="sm" nativeButton={false} render={<Link href="/search" />}>+ 책 추가</Button>
      </div>

      <Tabs defaultValue="reading">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reading">읽는 중 ({byStatus.reading.length})</TabsTrigger>
          <TabsTrigger value="completed">완독 ({byStatus.completed.length})</TabsTrigger>
          <TabsTrigger value="dropped">포기 ({byStatus.dropped.length})</TabsTrigger>
        </TabsList>
        {(['reading', 'completed', 'dropped'] as const).map(status => (
          <TabsContent key={status} value={status} className="space-y-3 mt-3">
            {byStatus[status].length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {status === 'reading' ? '읽고 있는 책이 없어요.' :
                 status === 'completed' ? '완독한 책이 없어요.' : '포기한 책이 없어요.'}
              </p>
            ) : (
              byStatus[status].map(record => (
                <BookCard key={record.id} record={record as any} />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
