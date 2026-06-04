// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// fetch를 모킹
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// KAKAO_REST_API_KEY 환경변수 설정
vi.stubEnv('KAKAO_REST_API_KEY', 'test-key')

describe('GET /api/books/search', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('query 없으면 400 반환', async () => {
    const { GET } = await import('@/app/api/books/search/route')
    const request = new Request('http://localhost/api/books/search')
    const response = await GET(request)
    expect(response.status).toBe(400)
  })

  it('카카오 API 결과를 정상 반환', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        documents: [
          {
            isbn: '9788936434120',
            title: '채식주의자',
            authors: ['한강'],
            publisher: '창비',
            thumbnail: 'https://example.com/cover.jpg',
            datetime: '2007-10-30T00:00:00.000+09:00',
          },
        ],
        meta: { total_count: 1, pageable_count: 1, is_end: true },
      }),
    })

    const { GET } = await import('@/app/api/books/search/route')
    const request = new Request('http://localhost/api/books/search?query=채식주의자')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.documents).toHaveLength(1)
    expect(data.documents[0].title).toBe('채식주의자')
    expect(data.documents[0].authors[0]).toBe('한강')
  })

  it('카카오 API 오류 시 500 반환', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })

    const { GET } = await import('@/app/api/books/search/route')
    const request = new Request('http://localhost/api/books/search?query=테스트')
    const response = await GET(request)
    expect(response.status).toBe(500)
  })
})
