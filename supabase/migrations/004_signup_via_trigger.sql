-- 가입 흐름을 트리거 기반으로 견고화한다.
-- 기존 문제: 이메일 확인이 켜져 있으면 signUp 직후 세션이 없어 클라이언트의
-- 닉네임/초대코드 업데이트가 RLS로 조용히 실패했고, anon은 invite_codes를
-- 읽을 수 없어 사전 검증도 항상 실패했다.
-- 해결: handle_new_user(SECURITY DEFINER) 안에서 metadata를 읽어 닉네임 설정 +
-- 초대코드 검증/소비를 원자적으로 처리한다. 세션도, service-role 키도 필요 없다.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_nickname text;
  v_invite_code text;
  v_invite_id uuid;
begin
  v_nickname := nullif(trim(new.raw_user_meta_data->>'nickname'), '');
  v_invite_code := nullif(trim(new.raw_user_meta_data->>'invite_code'), '');

  -- 초대 코드가 제공되면 검증하고 잠근다. (코드 없는 직접 SQL 시드는 허용)
  if v_invite_code is not null then
    select id into v_invite_id
    from public.invite_codes
    where code = v_invite_code and used_by is null
    for update;

    if v_invite_id is null then
      raise exception 'invalid_invite_code'
        using errcode = 'check_violation';
    end if;
  end if;

  insert into public.users (id, email, nickname)
  values (new.id, new.email, coalesce(v_nickname, split_part(new.email, '@', 1)));

  -- 유저 row 생성 후 초대 코드를 소비한다 (used_by FK가 users를 참조하므로 순서 중요).
  if v_invite_id is not null then
    update public.invite_codes
    set used_by = new.id, used_at = now()
    where id = v_invite_id;
  end if;

  return new;
end;
$function$;

-- 003 하드닝 유지: create or replace는 기본 PUBLIC EXECUTE를 복원하므로 다시 회수한다.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;

-- 가입 전 초대코드 유효성만 anon에게 boolean으로 노출 (테이블 전체 read 없이 UX 확보).
create or replace function public.is_invite_valid(p_code text)
returns boolean
language sql
security definer
set search_path to ''
as $function$
  select exists (
    select 1 from public.invite_codes
    where code = p_code and used_by is null
  );
$function$;

revoke execute on function public.is_invite_valid(text) from public;
grant execute on function public.is_invite_valid(text) to anon;
grant execute on function public.is_invite_valid(text) to authenticated;
