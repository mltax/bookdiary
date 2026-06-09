'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { kakaoBookToBook, type KakaoBook } from '@/lib/kakao/books'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Props {
  books: KakaoBook[]
}

export function BookSearchResults({ books }: Props) {
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSelect(kakaoBook: KakaoBook) {
    setSaving(kakaoBook.isbn)
    setError(null)
    const supabase = createClient()
    const bookData = kakaoBookToBook(kakaoBook)

    // isbn이 있으면 upsert, 없으면 insert
    let bookId: string
    if (bookData.isbn) {
      const { data, error } = await supabase
        .from('books')
        .upsert(bookData, { onConflict: 'isbn' })
        .select('id')
        .single()
      if (error || !data) { setError('책을 저장하지 못했습니다. 다시 시도해 주세요.'); setSaving(null); return }
      bookId = data.id
    } else {
      const { data, error } = await supabase
        .from('books')
        .insert(bookData)
        .select('id')
        .single()
      if (error || !data) { setError('책을 저장하지 못했습니다. 다시 시도해 주세요.'); setSaving(null); return }
      bookId = data.id
    }

    router.push(`/books/new?bookId=${bookId}`)
  }

  if (books.length === 0) {
    return <p className="text-center text-muted-foreground py-8">검색 결과가 없습니다.</p>
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {books.map((book) => (
        <Card key={book.isbn || book.title} className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="flex gap-3 p-3">
            {book.thumbnail && (
              <Image
                src={book.thumbnail}
                alt={book.title}
                width={60}
                height={80}
                className="object-cover rounded flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm leading-tight line-clamp-2">{book.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{book.authors.join(', ')}</p>
              <p className="text-xs text-muted-foreground">{book.publisher}</p>
            </div>
            <Button
              size="sm"
              onClick={() => handleSelect(book)}
              disabled={saving === book.isbn}
              className="flex-shrink-0 self-center"
            >
              {saving === book.isbn ? '저장 중...' : '선택'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
