'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface Props {
  recordId: string
}

export function DeleteRecordButton({ recordId }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    // RLS 정책(records: own delete)이 본인 기록만 삭제되도록 서버단에서 보장한다.
    const { error: deleteError } = await supabase
      .from('reading_records')
      .delete()
      .eq('id', recordId)

    if (deleteError) {
      setError('삭제에 실패했습니다. 다시 시도해 주세요.')
      setLoading(false)
      return
    }

    setOpen(false)
    router.push('/books')
    router.refresh()
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger
        render={
          <Button variant="destructive" className="w-full">
            기록 삭제
          </Button>
        }
      />
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-popover p-6 text-popover-foreground shadow-lg transition-all duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <AlertDialog.Title className="text-base font-semibold">
            기록을 삭제할까요?
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
            이 독서 기록과 관련된 피드 활동이 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없어요.
          </AlertDialog.Description>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialog.Close
              render={<Button variant="outline" disabled={loading}>취소</Button>}
            />
            <Button
              variant="destructive"
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? '삭제 중...' : '삭제'}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
