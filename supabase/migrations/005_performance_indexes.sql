-- 005_performance_indexes.sql
-- 외래키/정렬 컬럼에 인덱스를 추가해 피드·책 목록·프로필 조회 지연을 줄인다.
-- (Supabase performance advisor: unindexed_foreign_keys)

-- 피드 쿼리: created_at 내림차순 정렬 + users / reading_records 조인
create index if not exists idx_feed_activities_created_at
  on public.feed_activities (created_at desc);
create index if not exists idx_feed_activities_user_id
  on public.feed_activities (user_id);
create index if not exists idx_feed_activities_record_id
  on public.feed_activities (record_id);

-- 내 책 목록 / 프로필 통계: user_id 필터 + created_at 정렬, book 조인
create index if not exists idx_reading_records_user_created
  on public.reading_records (user_id, created_at desc);
create index if not exists idx_reading_records_book_id
  on public.reading_records (book_id);

-- 초대 코드 외래키
create index if not exists idx_invite_codes_created_by
  on public.invite_codes (created_by);
create index if not exists idx_invite_codes_used_by
  on public.invite_codes (used_by);
