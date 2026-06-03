# Book Diary Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 가족 전용 독서 일지 웹앱 — 구조화된 독서 기록(감정 태그, 기대감 vs 소감 비교)과 가족 피드 공유 기능을 갖춘 Next.js + Supabase 풀스택 앱을 구축한다.

**Architecture:** Next.js 14 App Router + TypeScript로 프론트와 API 라우트를 단일 앱으로 구성하고, Supabase로 인증/DB/스토리지를 처리한다. 카카오 책 검색 API는 서버 라우트를 통해 프록시하여 API 키를 노출하지 않는다.

**Tech Stack:** Next.js 14, TypeScript, Supabase, shadcn/ui, Tailwind CSS, Kakao Books API, Vitest, Vercel

---

## File Map

```
/
├── app/
│   ├── (auth)/login/page.tsx           — 로그인/회원가입 페이지
│   ├── (main)/
│   │   ├── layout.tsx                  — 인증 필요 레이아웃 + 네비게이션
│   │   ├── page.tsx                    — 가족 피드 홈
│   │   ├── search/page.tsx             — 책 검색 + 기록 시작
│   │   ├── books/page.tsx              — 내 독서 목록
│   │   ├── books/[id]/page.tsx         — 독서 기록 상세
│   │   ├── books/[id]/edit/page.tsx    — 독서 기록 수정
│   │   ├── family/page.tsx             — 가족 멤버 목록 + 통계
│   │   └── profile/page.tsx            — 내 프로필 + 통계
│   ├── api/books/search/route.ts       — 카카오 API 프록시
│   └── middleware.ts                   — 미로그인 redirect
├── lib/
│   ├── supabase/client.ts              — 브라우저 클라이언트
│   ├── supabase/server.ts              — 서버 클라이언트
│   ├── supabase/types.ts               — DB 타입 정의
│   └── constants.ts                    — 감정 태그 등 상수
├── components/
│   ├── auth/login-form.tsx
│   ├── auth/signup-form.tsx
│   ├── books/book-card.tsx
│   ├── books/book-search-results.tsx
│   ├── books/record-form.tsx
│   ├── books/emotion-tag-selector.tsx
│   └── feed/feed-activity-card.tsx
└── supabase/migrations/
    ├── 001_initial_schema.sql
    └── 002_rls_policies.sql
```

---

## Task 1: 프로젝트 초기 설정

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`
- Create: `.env.local.example`

- [ ] **Step 1: Next.js 프로젝트 생성**

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"
```

- [ ] **Step 2: 의존성 설치**

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: shadcn/ui 초기화**

```bash
npx shadcn@latest init
# 프롬프트: Default style → Default, Base color → Slate, CSS variables → Yes
```

- [ ] **Step 4: 필요한 shadcn 컴포넌트 설치**

```bash
npx shadcn@latest add button card input label badge tabs avatar separator
```

- [ ] **Step 5: `.env.local` 파일 생성**

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
KAKAO_REST_API_KEY=your_kakao_rest_api_key
```

- [ ] **Step 6: `.env.local.example` 작성**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
KAKAO_REST_API_KEY=
```

- [ ] **Step 7: vitest 설정 추가**

`vitest.config.ts` 생성:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './') },
  },
})
```

`vitest.setup.ts` 생성:

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 8: package.json에 test 스크립트 추가**

`package.json`의 scripts에 추가:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 9: 커밋**

```bash
git init
git add .
git commit -m "chore: initial Next.js project setup with Supabase and shadcn/ui"
```

---

## Task 2: Supabase 스키마 마이그레이션

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `supabase/migrations/002_rls_policies.sql`

- [ ] **Step 1: Supabase 프로젝트 생성**

[supabase.com](https://supabase.com)에서 새 프로젝트 생성 후 Project URL과 anon key를 `.env.local`에 입력.

- [ ] **Step 2: 초기 스키마 마이그레이션 파일 작성**

`supabase/migrations/001_initial_schema.sql`:

```sql
-- users 테이블 (auth.users와 연동)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  nickname text not null,
  avatar_url text,
  created_at timestamptz default now() not null
);

-- books 테이블
create table public.books (
  id uuid default gen_random_uuid() primary key,
  isbn text unique,
  title text not null,
  author text not null,
  publisher text,
  cover_image_url text,
  published_at date,
  created_at timestamptz default now() not null
);

-- reading_records 테이블
create table public.reading_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  book_id uuid references public.books(id) not null,
  status text not null check (status in ('reading', 'completed', 'dropped')),
  expected_feeling text,
  actual_feeling text,
  emotion_tags text[] default '{}',
  star_rating int check (star_rating >= 1 and star_rating <= 5),
  started_at date,
  finished_at date,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- feed_activities 테이블
create table public.feed_activities (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  record_id uuid references public.reading_records(id) on delete cascade not null,
  activity_type text not null check (activity_type in ('started', 'completed', 'dropped')),
  created_at timestamptz default now() not null
);

-- invite_codes 테이블
create table public.invite_codes (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  created_by uuid references public.users(id) not null,
  used_by uuid references public.users(id),
  used_at timestamptz,
  created_at timestamptz default now() not null
);

-- updated_at 자동 갱신 트리거
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger reading_records_updated_at
  before update on public.reading_records
  for each row execute function update_updated_at();

-- auth 유저 생성 시 users 테이블에 자동 삽입
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, nickname)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 3: RLS 정책 파일 작성**

`supabase/migrations/002_rls_policies.sql`:

```sql
-- RLS 활성화
alter table public.users enable row level security;
alter table public.books enable row level security;
alter table public.reading_records enable row level security;
alter table public.feed_activities enable row level security;
alter table public.invite_codes enable row level security;

-- users: 전체 read, 본인만 update
create policy "users: anyone can read" on public.users
  for select using (auth.role() = 'authenticated');

create policy "users: own update" on public.users
  for update using (auth.uid() = id);

-- books: 전체 read, 인증 유저 insert
create policy "books: anyone can read" on public.books
  for select using (auth.role() = 'authenticated');

create policy "books: authenticated insert" on public.books
  for insert with check (auth.role() = 'authenticated');

-- reading_records: 전체 read, 본인만 insert/update/delete
create policy "records: anyone can read" on public.reading_records
  for select using (auth.role() = 'authenticated');

create policy "records: own insert" on public.reading_records
  for insert with check (auth.uid() = user_id);

create policy "records: own update" on public.reading_records
  for update using (auth.uid() = user_id);

create policy "records: own delete" on public.reading_records
  for delete using (auth.uid() = user_id);

-- feed_activities: 전체 read, 본인만 insert
create policy "feed: anyone can read" on public.feed_activities
  for select using (auth.role() = 'authenticated');

create policy "feed: own insert" on public.feed_activities
  for insert with check (auth.uid() = user_id);

-- invite_codes: 인증 유저 read (가입 시 검증용), 인증 유저 insert, 본인만 update
create policy "invite: authenticated read" on public.invite_codes
  for select using (auth.role() = 'authenticated');

create policy "invite: authenticated insert" on public.invite_codes
  for insert with check (auth.uid() = created_by);

create policy "invite: own update" on public.invite_codes
  for update using (auth.uid() = created_by or auth.uid() = used_by);
```

- [ ] **Step 4: Supabase SQL Editor에서 마이그레이션 실행**

Supabase 대시보드 → SQL Editor → 001_initial_schema.sql 내용 붙여넣고 실행 → 002_rls_policies.sql 순서로 실행.

- [ ] **Step 5: 커밋**

```bash
git add supabase/
git commit -m "feat: add Supabase schema migrations and RLS policies"
```

---

## Task 3: Supabase 클라이언트 & 타입 설정

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/types.ts`
- Create: `lib/constants.ts`

- [ ] **Step 1: DB 타입 정의**

`lib/supabase/types.ts`:

```typescript
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
```

- [ ] **Step 2: 브라우저 Supabase 클라이언트**

`lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3: 서버 Supabase 클라이언트**

`lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 4: 상수 정의**

`lib/constants.ts`:

```typescript
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
```

- [ ] **Step 5: 커밋**

```bash
git add lib/
git commit -m "feat: add Supabase clients and type definitions"
```

---

## Task 4: 인증 미들웨어 & 보호된 레이아웃

**Files:**
- Create: `middleware.ts`
- Create: `app/(main)/layout.tsx`

- [ ] **Step 1: Next.js 미들웨어 작성**

`middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')

  if (!user && !isAuthPage && !isApiRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 2: 메인 레이아웃 (네비게이션 포함)**

`app/(main)/layout.tsx`:

```typescript
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between px-4">
          <Link href="/" className="font-bold text-lg">
            📚 책일기
          </Link>
          <nav className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/search">검색</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/books">내 책</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/family">가족</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/profile">프로필</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: 커밋**

```bash
git add middleware.ts app/
git commit -m "feat: add auth middleware and protected layout with navigation"
```

---

## Task 5: 로그인 & 회원가입 페이지

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `components/auth/login-form.tsx`
- Create: `components/auth/signup-form.tsx`

- [ ] **Step 1: 로그인 폼 컴포넌트**

`components/auth/login-form.tsx`:

```typescript
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          placeholder="email@example.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          placeholder="••••••••"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? '로그인 중...' : '로그인'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: 회원가입 폼 컴포넌트**

`components/auth/signup-form.tsx`:

```typescript
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    // 초대 코드 검증
    const { data: invite } = await supabase
      .from('invite_codes')
      .select('id')
      .eq('code', inviteCode)
      .is('used_by', null)
      .single()

    if (!invite) {
      setError('유효하지 않은 초대 코드입니다.')
      setLoading(false)
      return
    }

    // 회원가입
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname } },
    })

    if (signupError || !data.user) {
      setError(signupError?.message ?? '회원가입에 실패했습니다.')
      setLoading(false)
      return
    }

    // 닉네임 업데이트 (handle_new_user 트리거가 먼저 생성한 row 업데이트)
    await supabase
      .from('users')
      .update({ nickname })
      .eq('id', data.user.id)

    // 초대 코드 사용 처리
    await supabase
      .from('invite_codes')
      .update({ used_by: data.user.id, used_at: new Date().toISOString() })
      .eq('id', invite.id)

    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="invite">초대 코드</Label>
        <Input
          id="invite"
          value={inviteCode}
          onChange={e => setInviteCode(e.target.value)}
          required
          placeholder="가족에게 받은 초대 코드"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nickname">닉네임</Label>
        <Input
          id="nickname"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          required
          placeholder="표시될 이름"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">이메일</Label>
        <Input
          id="signup-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">비밀번호</Label>
        <Input
          id="signup-password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? '가입 중...' : '가입하기'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 3: 로그인 페이지**

`app/(auth)/login/page.tsx`:

```typescript
'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoginForm } from '@/components/auth/login-form'
import { SignupForm } from '@/components/auth/signup-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">📚 책일기</CardTitle>
          <p className="text-sm text-muted-foreground">가족과 함께하는 독서 일지</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">로그인</TabsTrigger>
              <TabsTrigger value="signup">회원가입</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-4">
              <LoginForm />
            </TabsContent>
            <TabsContent value="signup" className="mt-4">
              <SignupForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: 로컬에서 로그인/회원가입 흐름 테스트**

```bash
npm run dev
```

브라우저에서 `http://localhost:3000/login` 접속 → 회원가입 탭에서 초대 코드 없이 가입 시도 시 에러 메시지 확인.

*참고: 첫 번째 유저를 만들기 위해 Supabase 대시보드 → Authentication → Users에서 직접 유저 생성 후, SQL Editor에서 초대 코드를 수동 삽입:*
```sql
insert into invite_codes (code, created_by)
values ('FAMILY2024', '<admin-user-id>');
```

- [ ] **Step 5: 커밋**

```bash
git add app/ components/auth/
git commit -m "feat: add login and signup pages with invite code validation"
```

---

## Task 6: 카카오 책 검색 API 프록시 & 테스트

**Files:**
- Create: `app/api/books/search/route.ts`
- Create: `lib/kakao/books.ts`
- Create: `__tests__/api/books/search.test.ts`

- [ ] **Step 1: 카카오 API 타입 정의**

`lib/kakao/books.ts`:

```typescript
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
```

- [ ] **Step 2: 실패하는 테스트 작성**

`__tests__/api/books/search.test.ts`:

```typescript
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
```

- [ ] **Step 3: 테스트 실행 (실패 확인)**

```bash
npm test
```

Expected: FAIL — "Cannot find module '@/app/api/books/search/route'"

- [ ] **Step 4: API 라우트 구현**

`app/api/books/search/route.ts`:

```typescript
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')

  if (!query) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 })
  }

  const apiKey = process.env.KAKAO_REST_API_KEY
  const url = `https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(query)}&size=10`

  const response = await fetch(url, {
    headers: { Authorization: `KakaoAK ${apiKey}` },
  })

  if (!response.ok) {
    return NextResponse.json({ error: '책 검색에 실패했습니다.' }, { status: 500 })
  }

  const data = await response.json()
  return NextResponse.json(data)
}
```

- [ ] **Step 5: 테스트 실행 (통과 확인)**

```bash
npm test
```

Expected: PASS — 3 tests pass

- [ ] **Step 6: 커밋**

```bash
git add app/api/ lib/kakao/ __tests__/
git commit -m "feat: add Kakao Books API proxy route with tests"
```

---

## Task 7: 책 검색 페이지

**Files:**
- Create: `app/(main)/search/page.tsx`
- Create: `components/books/book-search-results.tsx`

- [ ] **Step 1: 책 검색 결과 컴포넌트**

`components/books/book-search-results.tsx`:

```typescript
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
  const router = useRouter()

  async function handleSelect(kakaoBook: KakaoBook) {
    setSaving(kakaoBook.isbn)
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
      if (error || !data) { setSaving(null); return }
      bookId = data.id
    } else {
      const { data, error } = await supabase
        .from('books')
        .insert(bookData)
        .select('id')
        .single()
      if (error || !data) { setSaving(null); return }
      bookId = data.id
    }

    router.push(`/books/new?bookId=${bookId}`)
  }

  if (books.length === 0) {
    return <p className="text-center text-muted-foreground py-8">검색 결과가 없습니다.</p>
  }

  return (
    <div className="space-y-3">
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
```

- [ ] **Step 2: 책 검색 페이지**

`app/(main)/search/page.tsx`:

```typescript
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
```

- [ ] **Step 3: 로컬에서 검색 흐름 테스트**

```bash
npm run dev
```

`http://localhost:3000/search` 접속 → 책 제목 검색 → 결과 카드 확인 → "선택" 클릭 시 `/books/new?bookId=...`로 이동 확인.

- [ ] **Step 4: 커밋**

```bash
git add app/(main)/search/ components/books/book-search-results.tsx
git commit -m "feat: add book search page with Kakao API integration"
```

---

## Task 8: 독서 기록 작성/수정 폼

**Files:**
- Create: `components/books/emotion-tag-selector.tsx`
- Create: `components/books/record-form.tsx`
- Create: `app/(main)/books/new/page.tsx`
- Create: `app/(main)/books/[id]/edit/page.tsx`

- [ ] **Step 1: 감정 태그 선택 컴포넌트**

`components/books/emotion-tag-selector.tsx`:

```typescript
'use client'
import { EMOTION_TAGS, type EmotionTag } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'

interface Props {
  selected: string[]
  onChange: (tags: string[]) => void
}

export function EmotionTagSelector({ selected, onChange }: Props) {
  function toggle(tag: EmotionTag) {
    onChange(
      selected.includes(tag)
        ? selected.filter(t => t !== tag)
        : [...selected, tag]
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {EMOTION_TAGS.map(tag => (
        <Badge
          key={tag}
          variant={selected.includes(tag) ? 'default' : 'outline'}
          className="cursor-pointer select-none"
          onClick={() => toggle(tag)}
        >
          {tag}
        </Badge>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: 독서 기록 폼 컴포넌트**

`components/books/record-form.tsx`:

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ReadingRecord, Book } from '@/lib/supabase/types'
import { STATUS_LABELS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EmotionTagSelector } from './emotion-tag-selector'
import Image from 'next/image'

type Status = 'reading' | 'completed' | 'dropped'

interface Props {
  book: Book
  existingRecord?: ReadingRecord
  userId: string
}

export function RecordForm({ book, existingRecord, userId }: Props) {
  const [status, setStatus] = useState<Status>(existingRecord?.status ?? 'reading')
  const [expectedFeeling, setExpectedFeeling] = useState(existingRecord?.expected_feeling ?? '')
  const [actualFeeling, setActualFeeling] = useState(existingRecord?.actual_feeling ?? '')
  const [emotionTags, setEmotionTags] = useState<string[]>(existingRecord?.emotion_tags ?? [])
  const [starRating, setStarRating] = useState<number>(existingRecord?.star_rating ?? 0)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const isFinished = status === 'completed' || status === 'dropped'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()

    const payload = {
      user_id: userId,
      book_id: book.id,
      status,
      expected_feeling: expectedFeeling || null,
      actual_feeling: isFinished ? (actualFeeling || null) : null,
      emotion_tags: isFinished ? emotionTags : [],
      star_rating: status === 'completed' && starRating > 0 ? starRating : null,
      started_at: new Date().toISOString().split('T')[0],
      finished_at: isFinished ? new Date().toISOString().split('T')[0] : null,
    }

    let recordId: string

    if (existingRecord) {
      const { data, error } = await supabase
        .from('reading_records')
        .update(payload)
        .eq('id', existingRecord.id)
        .select('id')
        .single()
      if (error || !data) { setSaving(false); return }
      recordId = data.id
    } else {
      const { data, error } = await supabase
        .from('reading_records')
        .insert(payload)
        .select('id')
        .single()
      if (error || !data) { setSaving(false); return }
      recordId = data.id
    }

    // 피드 활동 생성
    const activityType = status === 'reading' ? 'started' : status
    const shouldCreateFeed = !existingRecord || existingRecord.status !== status
    if (shouldCreateFeed) {
      await supabase.from('feed_activities').insert({
        user_id: userId,
        record_id: recordId,
        activity_type: activityType,
      })
    }

    router.push(`/books/${recordId}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 책 정보 표시 */}
      <div className="flex gap-3 p-3 bg-muted rounded-lg">
        {book.cover_image_url && (
          <Image src={book.cover_image_url} alt={book.title} width={50} height={67} className="object-cover rounded" />
        )}
        <div>
          <p className="font-medium text-sm">{book.title}</p>
          <p className="text-xs text-muted-foreground">{book.author}</p>
        </div>
      </div>

      {/* 독서 상태 */}
      <div className="space-y-2">
        <Label>독서 상태</Label>
        <div className="flex gap-2">
          {(['reading', 'completed', 'dropped'] as Status[]).map(s => (
            <Button
              key={s}
              type="button"
              variant={status === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatus(s)}
            >
              {STATUS_LABELS[s]}
            </Button>
          ))}
        </div>
      </div>

      {/* 읽기 전 기대감 */}
      <div className="space-y-2">
        <Label htmlFor="expected">읽기 전 기대감 (선택)</Label>
        <Textarea
          id="expected"
          value={expectedFeeling}
          onChange={e => setExpectedFeeling(e.target.value)}
          placeholder="이 책에 어떤 기대를 가지고 있나요?"
          rows={3}
        />
      </div>

      {/* 완독/포기 시 추가 필드 */}
      {isFinished && (
        <>
          {status === 'completed' && (
            <div className="space-y-2">
              <Label>별점</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setStarRating(n)}
                    className={`text-2xl transition-colors ${n <= starRating ? 'text-yellow-400' : 'text-muted-foreground'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>감정 태그</Label>
            <EmotionTagSelector selected={emotionTags} onChange={setEmotionTags} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="actual">읽은 후 소감</Label>
            <Textarea
              id="actual"
              value={actualFeeling}
              onChange={e => setActualFeeling(e.target.value)}
              placeholder="읽고 나서 어떠셨나요?"
              rows={4}
            />
          </div>
        </>
      )}

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? '저장 중...' : existingRecord ? '수정하기' : '기록 저장'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 3: 새 기록 페이지**

`app/(main)/books/new/page.tsx`:

```typescript
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RecordForm } from '@/components/books/record-form'

interface Props {
  searchParams: Promise<{ bookId?: string }>
}

export default async function NewRecordPage({ searchParams }: Props) {
  const { bookId } = await searchParams
  if (!bookId) redirect('/search')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single()

  if (!book) notFound()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">독서 기록 시작</h1>
      <RecordForm book={book} userId={user.id} />
    </div>
  )
}
```

- [ ] **Step 4: 수정 페이지**

`app/(main)/books/[id]/edit/page.tsx`:

```typescript
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RecordForm } from '@/components/books/record-form'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditRecordPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: record } = await supabase
    .from('reading_records')
    .select('*, book:books(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!record || !record.book) notFound()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">기록 수정</h1>
      <RecordForm book={record.book} existingRecord={record} userId={user.id} />
    </div>
  )
}
```

- [ ] **Step 5: 로컬 테스트**

```bash
npm run dev
```

`/search`에서 책 선택 → `/books/new?bookId=...` 접속 확인 → 상태 선택 + 기대감 작성 + 저장 → `/books/[id]`로 이동 확인.

- [ ] **Step 6: 커밋**

```bash
git add app/(main)/books/ components/books/
git commit -m "feat: add reading record create/edit form with emotion tags"
```

---

## Task 9: 내 독서 목록 페이지

**Files:**
- Create: `components/books/book-card.tsx`
- Create: `app/(main)/books/page.tsx`

- [ ] **Step 1: 책 카드 컴포넌트**

`components/books/book-card.tsx`:

```typescript
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ReadingRecord } from '@/lib/supabase/types'
import { STATUS_LABELS } from '@/lib/constants'

const STATUS_VARIANT = {
  reading: 'default',
  completed: 'secondary',
  dropped: 'outline',
} as const

interface Props {
  record: ReadingRecord & { book: { title: string; author: string; cover_image_url: string | null } }
}

export function BookCard({ record }: Props) {
  return (
    <Link href={`/books/${record.id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="flex gap-3 p-3">
          {record.book.cover_image_url && (
            <Image
              src={record.book.cover_image_url}
              alt={record.book.title}
              width={50}
              height={67}
              className="object-cover rounded flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm leading-tight line-clamp-2">{record.book.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{record.book.author}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={STATUS_VARIANT[record.status]} className="text-xs">
                {STATUS_LABELS[record.status]}
              </Badge>
              {record.star_rating && (
                <span className="text-xs text-yellow-500">{'★'.repeat(record.star_rating)}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
```

- [ ] **Step 2: 내 독서 목록 페이지**

`app/(main)/books/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BookCard } from '@/components/books/book-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function BooksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: records } = await supabase
    .from('reading_records')
    .select('*, book:books(title, author, cover_image_url)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const byStatus = {
    reading: records?.filter(r => r.status === 'reading') ?? [],
    completed: records?.filter(r => r.status === 'completed') ?? [],
    dropped: records?.filter(r => r.status === 'dropped') ?? [],
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">내 독서 목록</h1>
        <Button size="sm" asChild>
          <Link href="/search">+ 책 추가</Link>
        </Button>
      </div>

      <Tabs defaultValue="reading">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reading">읽는 중 ({byStatus.reading.length})</TabsTrigger>
          <TabsTrigger value="completed">완독 ({byStatus.completed.length})</TabsTrigger>
          <TabsTrigger value="dropped">포기 ({byStatus.dropped.length})</TabsTrigger>
        </TabsList>
        {(['reading', 'completed', 'dropped'] as const).map(status => (
          <TabsContent key={status} value={status} className="space-y-3 mt-3">
            {byStatus[status].length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {status === 'reading' ? '읽고 있는 책이 없어요.' :
                 status === 'completed' ? '완독한 책이 없어요.' : '포기한 책이 없어요.'}
              </p>
            ) : (
              byStatus[status].map(record => (
                <BookCard key={record.id} record={record as any} />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 3: 커밋**

```bash
git add app/(main)/books/page.tsx components/books/book-card.tsx
git commit -m "feat: add my books list page with status filter tabs"
```

---

## Task 10: 독서 기록 상세 페이지

**Files:**
- Create: `app/(main)/books/[id]/page.tsx`

- [ ] **Step 1: 상세 페이지 구현**

`app/(main)/books/[id]/page.tsx`:

```typescript
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { STATUS_LABELS } from '@/lib/constants'

interface Props {
  params: Promise<{ id: string }>
}

export default async function RecordDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: record } = await supabase
    .from('reading_records')
    .select('*, book:books(*), user:users(nickname, avatar_url)')
    .eq('id', id)
    .single()

  if (!record) notFound()

  const isOwner = record.user_id === user.id
  const isFinished = record.status === 'completed' || record.status === 'dropped'

  return (
    <div className="space-y-4">
      {/* 책 헤더 */}
      <div className="flex gap-4">
        {record.book.cover_image_url && (
          <Image
            src={record.book.cover_image_url}
            alt={record.book.title}
            width={80}
            height={107}
            className="object-cover rounded shadow"
          />
        )}
        <div className="flex-1">
          <h1 className="font-bold text-lg leading-tight">{record.book.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{record.book.author}</p>
          {record.book.publisher && (
            <p className="text-xs text-muted-foreground">{record.book.publisher}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge>{STATUS_LABELS[record.status]}</Badge>
            {record.star_rating && (
              <span className="text-yellow-500 text-sm">{'★'.repeat(record.star_rating)}{'☆'.repeat(5 - record.star_rating)}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            기록자: {record.user?.nickname}
          </p>
        </div>
      </div>

      <Separator />

      {/* 기대감 vs 소감 비교 */}
      <div className="grid gap-3">
        {record.expected_feeling && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">📖 읽기 전 기대감</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{record.expected_feeling}</p>
            </CardContent>
          </Card>
        )}
        {isFinished && record.actual_feeling && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">✅ 읽은 후 소감</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{record.actual_feeling}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 감정 태그 */}
      {record.emotion_tags?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {record.emotion_tags.map((tag: string) => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          ))}
        </div>
      )}

      {/* 날짜 정보 */}
      <div className="text-xs text-muted-foreground space-y-1">
        {record.started_at && <p>시작일: {record.started_at}</p>}
        {record.finished_at && <p>완료일: {record.finished_at}</p>}
      </div>

      {/* 수정 버튼 (본인만) */}
      {isOwner && (
        <Button variant="outline" className="w-full" asChild>
          <Link href={`/books/${id}/edit`}>기록 수정</Link>
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 로컬에서 상세 페이지 테스트**

기록 저장 후 상세 페이지 접속 → 기대감/소감 섹션, 감정 태그, 수정 버튼 표시 확인.

- [ ] **Step 3: 커밋**

```bash
git add app/(main)/books/
git commit -m "feat: add reading record detail page with before/after comparison"
```

---

## Task 11: 가족 피드 홈 페이지

**Files:**
- Create: `components/feed/feed-activity-card.tsx`
- Create: `app/(main)/page.tsx`

- [ ] **Step 1: 피드 활동 카드 컴포넌트**

`components/feed/feed-activity-card.tsx`:

```typescript
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { FeedActivity } from '@/lib/supabase/types'
import { ACTIVITY_LABELS } from '@/lib/constants'

interface Props {
  activity: FeedActivity
}

export function FeedActivityCard({ activity }: Props) {
  const { user, record } = activity
  const book = record?.book

  if (!user || !record || !book) return null

  const activityLabel = ACTIVITY_LABELS[activity.activity_type]
  const date = new Date(activity.created_at).toLocaleDateString('ko-KR')

  return (
    <Link href={`/books/${activity.record_id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="flex gap-3 p-3">
          {book.cover_image_url && (
            <Image
              src={book.cover_image_url}
              alt={book.title}
              width={50}
              height={67}
              className="object-cover rounded flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">{user.nickname}</span>
              <Badge variant="outline" className="text-xs">{activityLabel}</Badge>
            </div>
            <p className="text-sm font-medium line-clamp-1">{book.title}</p>
            <p className="text-xs text-muted-foreground">{book.author}</p>
            {record.star_rating && activity.activity_type === 'completed' && (
              <span className="text-xs text-yellow-500">{'★'.repeat(record.star_rating)}</span>
            )}
            <p className="text-xs text-muted-foreground mt-1">{date}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
```

- [ ] **Step 2: 홈 피드 페이지**

`app/(main)/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FeedActivityCard } from '@/components/feed/feed-activity-card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: activities } = await supabase
    .from('feed_activities')
    .select(`
      *,
      user:users(nickname, avatar_url),
      record:reading_records(
        *,
        book:books(title, author, cover_image_url)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(30)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">가족 피드</h1>
        <Button size="sm" asChild>
          <Link href="/search">+ 책 추가</Link>
        </Button>
      </div>

      {!activities || activities.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-muted-foreground">아직 독서 기록이 없어요.</p>
          <Button asChild>
            <Link href="/search">첫 번째 책을 기록해보세요</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map(activity => (
            <FeedActivityCard key={activity.id} activity={activity as any} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: 로컬 테스트**

홈 접속 → 가족 피드에서 활동 카드 확인 → 카드 클릭 시 상세 이동 확인.

- [ ] **Step 4: 커밋**

```bash
git add app/(main)/page.tsx components/feed/
git commit -m "feat: add family feed home page with activity cards"
```

---

## Task 12: 가족 & 프로필 페이지

**Files:**
- Create: `app/(main)/family/page.tsx`
- Create: `app/(main)/profile/page.tsx`

- [ ] **Step 1: 가족 페이지**

`app/(main)/family/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default async function FamilyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: members } = await supabase
    .from('users')
    .select('id, nickname, avatar_url, created_at')
    .order('created_at')

  // 각 멤버의 완독 수 집계
  const { data: stats } = await supabase
    .from('reading_records')
    .select('user_id, status')

  const statsByUser = (stats ?? []).reduce<Record<string, { reading: number; completed: number; dropped: number }>>(
    (acc, r) => {
      if (!acc[r.user_id]) acc[r.user_id] = { reading: 0, completed: 0, dropped: 0 }
      acc[r.user_id][r.status as 'reading' | 'completed' | 'dropped']++
      return acc
    },
    {}
  )

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">가족 멤버</h1>
      <div className="space-y-3">
        {members?.map(member => {
          const s = statsByUser[member.id] ?? { reading: 0, completed: 0, dropped: 0 }
          return (
            <Card key={member.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <Avatar>
                  <AvatarImage src={member.avatar_url ?? undefined} />
                  <AvatarFallback>{member.nickname[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{member.nickname}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                    <span>읽는 중 {s.reading}</span>
                    <span>완독 {s.completed}</span>
                    <span>포기 {s.dropped}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 프로필 페이지**

`app/(main)/profile/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

async function SignOutButton() {
  'use server'
  // 클라이언트 컴포넌트로 분리 필요 — 아래 참조
  return null
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: records } = await supabase
    .from('reading_records')
    .select('status, created_at')
    .eq('user_id', user.id)

  const stats = (records ?? []).reduce(
    (acc, r) => {
      acc[r.status as 'reading' | 'completed' | 'dropped']++
      return acc
    },
    { reading: 0, completed: 0, dropped: 0 }
  )

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">내 프로필</h1>

      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xl">{profile?.nickname?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold text-lg">{profile?.nickname}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">독서 통계</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{stats.reading}</p>
            <p className="text-xs text-muted-foreground">읽는 중</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">완독</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-muted-foreground">{stats.dropped}</p>
            <p className="text-xs text-muted-foreground">포기</p>
          </div>
        </CardContent>
      </Card>

      <LogoutButton />
    </div>
  )
}
```

`components/auth/logout-button.tsx` 별도 생성:

```typescript
'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <Button variant="outline" className="w-full" onClick={handleLogout}>
      로그아웃
    </Button>
  )
}
```

그리고 `profile/page.tsx`에서 import 수정:

```typescript
import { LogoutButton } from '@/components/auth/logout-button'
// SignOutButton 함수 제거하고 <LogoutButton /> 사용
```

- [ ] **Step 3: 로컬 테스트**

`/family` → 가족 멤버 목록 + 통계 확인  
`/profile` → 프로필 + 통계 + 로그아웃 버튼 확인

- [ ] **Step 4: 커밋**

```bash
git add app/(main)/family/ app/(main)/profile/ components/auth/logout-button.tsx
git commit -m "feat: add family members page and user profile page"
```

---

## Task 13: Vercel 배포

**Files:**
- Modify: `next.config.ts` (이미지 도메인 설정)

- [ ] **Step 1: next.config.ts 이미지 도메인 허용**

`next.config.ts`:

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'search1.kakaocdn.net',
      },
      {
        protocol: 'https',
        hostname: 'thumbnail.image.kakaocdn.net',  // 카카오 책 표지
      },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 2: Vercel 프로젝트 생성 및 환경변수 설정**

1. [vercel.com](https://vercel.com)에서 GitHub 저장소 import
2. Environment Variables에 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `KAKAO_REST_API_KEY`

- [ ] **Step 3: 배포**

```bash
git add next.config.ts
git commit -m "chore: add Kakao CDN domains to Next.js image config"
git push origin main
```

Vercel이 자동으로 빌드 및 배포 시작.

- [ ] **Step 4: 배포 후 E2E 확인**

배포된 URL에서:
1. `/login` → 회원가입 (초대 코드 필요)
2. 로그인 → 홈 피드
3. `/search` → 책 검색 → 기록 저장
4. 완독 처리 → 홈 피드에 활동 노출 확인

- [ ] **Step 5: 최종 커밋**

```bash
git commit --allow-empty -m "chore: deployment complete"
```

---

## 자체 검토 체크리스트

- [x] **초대 코드 흐름**: Task 5에서 invite_codes 검증 + 사용 처리 포함
- [x] **카카오 API 프록시**: Task 6에서 서버 라우트로 API 키 보호
- [x] **피드 자동 생성**: Task 8 RecordForm에서 상태 변경 시 feed_activities insert
- [x] **RLS 정책**: Task 2에서 모든 테이블 정책 정의
- [x] **기대감 vs 소감 비교**: Task 10 상세 페이지에서 카드로 나란히 표시
- [x] **수동 입력 fallback**: Task 7에서 검색 실패 시 에러 메시지 안내 (완전한 수동 폼은 MVP 이후)
- [x] **미들웨어 redirect**: Task 4에서 미로그인 시 /login redirect
- [x] **이미지 도메인**: Task 13에서 next.config.ts 설정
