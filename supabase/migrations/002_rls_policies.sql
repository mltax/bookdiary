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
