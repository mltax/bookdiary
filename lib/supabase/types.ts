export type ReadingStatus = 'reading' | 'completed' | 'dropped'
export type ActivityType = 'started' | 'completed' | 'dropped'

export interface User {
  id: string
  email: string
  nickname: string
  avatar_url: string | null
  created_at: string
}

export interface Book {
  id: string
  isbn: string | null
  title: string
  author: string
  publisher: string | null
  cover_image_url: string | null
  published_at: string | null
  created_at: string
}

export interface ReadingRecord {
  id: string
  user_id: string
  book_id: string
  status: ReadingStatus
  expected_feeling: string | null
  actual_feeling: string | null
  emotion_tags: string[]
  star_rating: number | null
  started_at: string | null
  finished_at: string | null
  created_at: string
  updated_at: string
  // joined
  book?: Book
  user?: User
}

export interface FeedActivity {
  id: string
  user_id: string
  record_id: string
  activity_type: ActivityType
  created_at: string
  // joined
  user?: User
  record?: ReadingRecord & { book: Book }
}

export interface InviteCode {
  id: string
  code: string
  created_by: string
  used_by: string | null
  used_at: string | null
  created_at: string
}
