-- 006_rls_initplan_optimization.sql
-- RLS 정책에서 auth.uid()/auth.role()을 (select ...)로 감싸 행마다 재평가되지
-- 않고 쿼리당 1회만 평가되도록 한다. 의미는 동일, 대량 조회 시 성능 향상.
-- (Supabase performance advisor: auth_rls_initplan)

-- users
alter policy "users: anyone can read" on public.users
  using ((select auth.role()) = 'authenticated');
alter policy "users: own update" on public.users
  using ((select auth.uid()) = id);

-- books
alter policy "books: anyone can read" on public.books
  using ((select auth.role()) = 'authenticated');
alter policy "books: authenticated insert" on public.books
  with check ((select auth.role()) = 'authenticated');

-- reading_records
alter policy "records: anyone can read" on public.reading_records
  using ((select auth.role()) = 'authenticated');
alter policy "records: own insert" on public.reading_records
  with check ((select auth.uid()) = user_id);
alter policy "records: own update" on public.reading_records
  using ((select auth.uid()) = user_id);
alter policy "records: own delete" on public.reading_records
  using ((select auth.uid()) = user_id);

-- feed_activities
alter policy "feed: anyone can read" on public.feed_activities
  using ((select auth.role()) = 'authenticated');
alter policy "feed: own insert" on public.feed_activities
  with check ((select auth.uid()) = user_id);

-- invite_codes
alter policy "invite: authenticated read" on public.invite_codes
  using ((select auth.role()) = 'authenticated');
alter policy "invite: authenticated insert" on public.invite_codes
  with check ((select auth.uid()) = created_by);
alter policy "invite: own update" on public.invite_codes
  using ((select auth.uid()) = created_by or (select auth.uid()) = used_by);
