export const EMOTION_TAGS = [
  '감동적',
  '재미있음',
  '지루함',
  '생각하게 됨',
  '슬픔',
  '설렘',
  '무거움',
  '가벼움',
  '추천함',
  '다시읽고싶음',
] as const

export type EmotionTag = typeof EMOTION_TAGS[number]

export const STATUS_LABELS: Record<string, string> = {
  reading: '읽는 중',
  completed: '완독',
  dropped: '포기',
}

export const ACTIVITY_LABELS: Record<string, string> = {
  started: '읽기 시작',
  completed: '완독',
  dropped: '포기',
}

// 상태별 따뜻한 배지 색 (reading / completed / dropped)
export const STATUS_BADGE: Record<string, string> = {
  reading: 'border-transparent bg-amber-100 text-amber-700',
  completed: 'border-transparent bg-primary/15 text-primary',
  dropped: 'border-transparent bg-stone-100 text-stone-500',
}

// 피드 활동별 배지 색 (started / completed / dropped)
export const ACTIVITY_BADGE: Record<string, string> = {
  started: 'border-transparent bg-amber-100 text-amber-700',
  completed: 'border-transparent bg-primary/15 text-primary',
  dropped: 'border-transparent bg-stone-100 text-stone-500',
}

// 감정 태그별 파스텔 색 (선택됐을 때)
export const EMOTION_COLORS: Record<string, string> = {
  '감동적': 'border-transparent bg-rose-100 text-rose-700',
  '재미있음': 'border-transparent bg-amber-100 text-amber-700',
  '지루함': 'border-transparent bg-stone-200 text-stone-600',
  '생각하게 됨': 'border-transparent bg-violet-100 text-violet-700',
  '슬픔': 'border-transparent bg-sky-100 text-sky-700',
  '설렘': 'border-transparent bg-pink-100 text-pink-700',
  '무거움': 'border-transparent bg-stone-300 text-stone-700',
  '가벼움': 'border-transparent bg-cyan-100 text-cyan-700',
  '추천함': 'border-transparent bg-emerald-100 text-emerald-700',
  '다시읽고싶음': 'border-transparent bg-orange-100 text-orange-700',
}
