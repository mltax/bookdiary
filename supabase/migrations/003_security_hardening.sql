-- Fix function_search_path_mutable: pin an empty search_path so the functions
-- always resolve objects via fully-qualified names (built-ins still resolve via pg_catalog).
create or replace function public.update_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, nickname)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$;

-- handle_new_user stays SECURITY DEFINER because it must insert into public.users
-- on behalf of a brand-new auth user, but it should NEVER be callable as an RPC.
-- Triggers fire regardless of EXECUTE grants, so revoking is safe.
revoke execute on function public.handle_new_user() from anon, authenticated, public;
