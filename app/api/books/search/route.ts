import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')

  if (!query) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 })
  }

  const apiKey = process.env.KAKAO_REST_API_KEY
  if (!apiKey || apiKey === 'your_kakao_rest_api_key') {
    console.error('KAKAO_REST_API_KEY is not configured')
    return NextResponse.json({ error: '검색 서비스가 설정되지 않았습니다.' }, { status: 503 })
  }

  const url = `https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(query)}&size=10`

  const response = await fetch(url, {
    headers: { Authorization: `KakaoAK ${apiKey}` },
  })

  if (!response.ok) {
    console.error('Kakao book search failed:', response.status, await response.text())
    return NextResponse.json({ error: '책 검색에 실패했습니다.' }, { status: 500 })
  }

  const data = await response.json()
  return NextResponse.json(data)
}
