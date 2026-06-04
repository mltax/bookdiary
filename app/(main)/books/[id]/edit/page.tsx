import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RecordForm } from '@/components/books/record-form'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditRecordPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: record } = await supabase
    .from('reading_records')
    .select('*, book:books(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!record || !record.book) notFound()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">기록 수정</h1>
      <RecordForm book={record.book} existingRecord={record} userId={user.id} />
    </div>
  )
}
