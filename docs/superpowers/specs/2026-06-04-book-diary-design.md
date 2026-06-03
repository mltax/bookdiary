# Book Diary Service — Design Spec

**Date:** 2026-06-04  
**Status:** Approved

---

## Overview

가족 전용 독서 일지 웹앱. 각자 읽은 책에 대한 구조화된 기록(감정 태그, 읽기 전 기대감 vs 읽은 후 소감, 독서 상태)을 남기고, 가족 피드에서 서로의 독서 활동을 공유한다.

---

## Tech Stack

| 역할 | 기술 |
|------|------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| Backend | Next.js API Routes (서버리스) |
| DB / Auth | Supabase (PostgreSQL + Auth + Storage) |
| 책 검색 | 카카오 책 검색 API |
| 배포 | Vercel |

---

## Architecture

```
사용자 브라우저
    ↓
Next.js App (Vercel 배포)
    ├── /app              — 페이지 라우팅 (App Router)
    ├── /api/books/search — 카카오 API 프록시 (서버 라우트)
    └── Supabase Client
            ├── Auth      (이메일/패스워드 로그인)
            ├── PostgreSQL (독서 기록, 유저, 피드)
            └── Storage   (프로필 이미지)
```

---

## Data Model

```sql
-- 사용자 (Supabase Auth 연동)
users
  id            uuid PRIMARY KEY  -- Supabase auth.users 참조
  email         text
  nickname      text
  avatar_url    text
  created_at    timestamptz

-- 책 (카카오 API 검색 후 저장, 중복 방지)
books
  id              uuid PRIMARY KEY
  isbn            text UNIQUE
  title           text
  author          text
  publisher       text
  cover_image_url text
  published_at    date

-- 독서 기록 (핵심 엔티티)
reading_records
  id                uuid PRIMARY KEY
  user_id           uuid REFERENCES users(id)
  book_id           uuid REFERENCES books(id)
  status            text  -- 'reading' | 'completed' | 'dropped'
  expected_feeling  text  -- 읽기 전 기대감
  actual_feeling    text  -- 읽은 후 소감
  emotion_tags      text[]  -- ['감동적', '재미있음', ...]
  star_rating       int   -- 1~5 (완독 시만)
  started_at        date
  finished_at       date  -- 완독/포기 시 기록
  created_at        timestamptz
  updated_at        timestamptz

-- 가족 피드 활동 (상태 변경 시 자동 생성)
feed_activities
  id            uuid PRIMARY KEY
  user_id       uuid REFERENCES users(id)
  record_id     uuid REFERENCES reading_records(id)
  activity_type text  -- 'started' | 'completed' | 'dropped'
  created_at    timestamptz

-- 가족 초대 코드
invite_codes
  id            uuid PRIMARY KEY
  code          text UNIQUE
  created_by    uuid REFERENCES users(id)
  used_by       uuid REFERENCES users(id)  -- NULL이면 미사용
  used_at       timestamptz
  created_at    timestamptz
```

**감정 태그 목록 (사전 정의)**
`감동적`, `재미있음`, `지루함`, `생각하게 됨`, `슬픔`, `설렘`, `무거움`, `가벼움`, `추천함`, `다시읽고싶음`

---

## Pages & Routing

| 경로 | 설명 |
|------|------|
| `/` | 가족 피드 (최근 활동 카드 목록) |
| `/search` | 카카오 API 책 검색 → 기록 시작 |
| `/books` | 내 독서 목록 (상태별 필터) |
| `/books/[id]` | 독서 기록 상세 (기대감 vs 소감 비교) |
| `/books/[id]/edit` | 기록 작성/수정 |
| `/family` | 가족 멤버 목록 + 각자 독서 통계 |
| `/profile` | 내 프로필 + 독서 통계 |
| `/login` | 이메일 로그인 / 회원가입 |

---

## Core UX Flows

### 1. 책 기록 시작
1. `/search`에서 책 제목 검색
2. 카카오 API 결과에서 책 선택 (표지 이미지, 제목, 저자 자동 입력)
3. 독서 상태 선택 (`읽는 중` / `완독` / `포기`)
4. 읽기 전 기대감 작성 (선택)
5. 저장 → `feed_activities`에 `started` 자동 생성 → 가족 피드에 노출 → `/books`로 이동

### 2. 완독 처리
1. 기록 상세에서 상태를 `완독`으로 변경
2. 별점(1~5) 입력
3. 감정 태그 선택 (복수 선택)
4. 읽은 후 소감 작성
5. 저장 → `feed_activities`에 자동 생성 → 가족 피드에 노출

### 3. 가족 피드 확인
1. 홈(`/`)에서 가족 전원의 최근 활동을 시간 역순으로 확인
2. 카드 클릭 → 해당 기록 상세 페이지 (읽기 전용)

---

## Authentication & Authorization

**로그인**: Supabase Auth 이메일/패스워드

**가족 초대**:
- 관리자가 초대 코드를 생성하여 공유
- 초대 코드 없이는 회원가입 불가 (가족 전용 보호)
- 초대 코드는 `invite_codes` 테이블로 관리 (1회용)

**Supabase RLS 정책**:
- `reading_records`: 본인만 insert/update/delete, 같은 서비스 유저 전체 read
- `feed_activities`: 본인만 insert, 전체 read
- `books`: 전체 read, 인증된 유저 insert
- `users`: 본인만 update, 전체 read (닉네임/아바타)

---

## Error Handling

| 상황 | 처리 방식 |
|------|----------|
| 카카오 API 검색 결과 없음 | 수동 입력 폼으로 fallback |
| 카카오 API 오류 | 에러 메시지 표시 + 수동 입력 안내 |
| 미로그인 접근 | Next.js middleware → `/login` redirect |
| 중복 ISBN 책 저장 | upsert로 처리 (기존 책 재사용) |

---

## Testing Strategy

- **API 라우트 단위 테스트**: 카카오 책 검색 프록시, 기록 CRUD 엔드포인트
- **Supabase RLS 정책 검증**: SQL 테스트로 권한 경계 확인
- **UI 확인**: 로컬 브라우저 직접 테스트 (MVP 규모)

---

## Out of Scope (MVP)

- 푸시 알림
- 책 추천 알고리즘
- 댓글/좋아요 소셜 기능
- 모바일 앱 (네이티브)
- 독서 목표 설정
