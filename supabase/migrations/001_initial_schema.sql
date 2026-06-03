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
