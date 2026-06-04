export interface KakaoBook {
  isbn: string
  title: string
  authors: string[]
  publisher: string
  thumbnail: string
  datetime: string
}

export interface KakaoSearchResponse {
  documents: KakaoBook[]
  meta: {
    total_count: number
    pageable_count: number
    is_end: boolean
  }
}

export function kakaoBookToBook(kakao: KakaoBook) {
  return {
    isbn: kakao.isbn.split(' ')[0] || null,
    title: kakao.title,
    author: kakao.authors.join(', '),
    publisher: kakao.publisher || null,
    cover_image_url: kakao.thumbnail || null,
    published_at: kakao.datetime ? kakao.datetime.split('T')[0] : null,
  }
}
