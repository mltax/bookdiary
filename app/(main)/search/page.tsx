'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BookSearchResults } from '@/components/books/book-search-results'
import type { KakaoBook } from '@/lib/kakao/books'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<KakaoBook[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError(null)

    const response = await fetch(`/api/books/search?query=${encodeURIComponent(query)}`)
    if (!response.ok) {
      setError('검색에 실패했습니다. 잠시 후 다시 시도해주세요.')
      setLoading(false)
      return
    }

    const data = await response.json()
    setResults(data.documents ?? [])
    setSearched(true)
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">책 검색</h1>
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="책 제목이나 저자를 입력하세요"
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          {loading ? '검색 중...' : '검색'}
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {searched && <BookSearchResults books={results} />}
    </div>
  )
}
