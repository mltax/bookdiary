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
