import { notFound, redirect } from 'next/navigation'
import { createClient, getCachedUser } from '@/lib/supabase/server'
import { RecordForm } from '@/components/books/record-form'

interface Props {
  searchParams: Promise<{ bookId?: string }>
}

export default async function NewRecordPage({ searchParams }: Props) {
  const { bookId } = await searchParams
  if (!bookId) redirect('/search')

  const user = await getCachedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single()

  if (!book) notFound()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">독서 기록 시작</h1>
      <RecordForm book={book} userId={user.id} />
    </div>
  )
}
