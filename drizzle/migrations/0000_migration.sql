
-- ROLES
create type public.app_role as enum ('admin','user');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null, role app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated; grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Estudante',
  avatar_url text, avatar_emoji text not null default '🦉', avatar_color text not null default '#2563eb',
  points int not null default 0, banned boolean not null default false,
  created_at timestamptz not null default now());
grant select on public.profiles to authenticated;
grant update (display_name, avatar_url, avatar_emoji, avatar_color) on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles readable" on public.profiles for select to authenticated using (true);
create policy "update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.is_banned(_uid uuid) returns boolean language sql stable security definer set search_path=public as $$ select coalesce((select banned from public.profiles where id=_uid), false) $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id, display_name) values (new.id, coalesce(nullif(new.raw_user_meta_data->>'display_name',''), nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1)));
  insert into public.user_roles(user_id, role) values (new.id,'user');
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles(user_id, role) values (new.id,'admin');
  end if;
  insert into public.room_members(room_id, user_id) values ('00000000-0000-0000-0000-000000000001', new.id) on conflict do nothing;
  return new;
end $$;

-- SETTINGS
create table public.app_settings (id int primary key default 1 check (id=1), primary_color text not null default '#2563eb', accent_color text not null default '#f59e0b');
grant select on public.app_settings to anon, authenticated; grant update on public.app_settings to authenticated; grant all on public.app_settings to service_role;
alter table public.app_settings enable row level security;
create policy "settings read" on public.app_settings for select to anon, authenticated using (true);
create policy "settings admin" on public.app_settings for update to authenticated using (public.has_role(auth.uid(),'admin'));
insert into public.app_settings(id) values (1);

-- CONTENT
create table public.subjects (id uuid primary key default gen_random_uuid(), name text not null, icon text not null default '📘', color text not null default '#2563eb', position int not null default 0);
create table public.lessons (id uuid primary key default gen_random_uuid(), subject_id uuid not null references public.subjects(id) on delete cascade, title text not null, caption text, theory text not null default '', video_url text, pdf_url text, position int not null default 0);
create table public.questions (id uuid primary key default gen_random_uuid(), lesson_id uuid not null references public.lessons(id) on delete cascade, prompt text not null, image_url text, options jsonb not null default '[]', correct_index int not null default 0, position int not null default 0);
grant select on public.subjects, public.lessons to authenticated;
grant insert, update, delete on public.subjects, public.lessons, public.questions to authenticated;
grant select (id, lesson_id, prompt, image_url, options, position) on public.questions to authenticated;
grant all on public.subjects, public.lessons, public.questions to service_role;
alter table public.subjects enable row level security; alter table public.lessons enable row level security; alter table public.questions enable row level security;
create policy "read subjects" on public.subjects for select to authenticated using (true);
create policy "admin subjects" on public.subjects for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "read lessons" on public.lessons for select to authenticated using (true);
create policy "admin lessons" on public.lessons for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "read questions" on public.questions for select to authenticated using (true);
create policy "admin questions" on public.questions for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.admin_questions(_lesson uuid) returns setof public.questions language plpgsql stable security definer set search_path=public as $$
begin if not public.has_role(auth.uid(),'admin') then raise exception 'forbidden'; end if;
return query select * from public.questions where lesson_id=_lesson order by position; end $$;

create table public.quiz_attempts (id uuid primary key default gen_random_uuid(), user_id uuid not null, lesson_id uuid not null references public.lessons(id) on delete cascade, score int not null, total int not null, created_at timestamptz not null default now(), unique(user_id, lesson_id));
grant select on public.quiz_attempts to authenticated; grant all on public.quiz_attempts to service_role;
alter table public.quiz_attempts enable row level security;
create policy "own attempts" on public.quiz_attempts for select to authenticated using (user_id = auth.uid());

create or replace function public.submit_quiz(_lesson uuid, _answers int[]) returns jsonb language plpgsql security definer set search_path=public as $$
declare q record; i int := 0; sc int := 0; corrects int[] := '{}'; first boolean; pts int;
begin
  if auth.uid() is null then raise exception 'auth'; end if;
  for q in select correct_index from public.questions where lesson_id=_lesson order by position, id loop
    i := i + 1; corrects := corrects || q.correct_index;
    if _answers[i] = q.correct_index then sc := sc + 1; end if;
  end loop;
  first := not exists(select 1 from public.quiz_attempts where user_id=auth.uid() and lesson_id=_lesson);
  pts := sc * 10;
  if first then
    insert into public.quiz_attempts(user_id, lesson_id, score, total) values (auth.uid(), _lesson, sc, i);
    update public.profiles set points = points + pts where id = auth.uid();
  end if;
  return jsonb_build_object('score', sc, 'total', i, 'correct', to_jsonb(corrects), 'awarded', case when first then pts else 0 end);
end $$;

-- COMMUNITY
create table public.comments (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), target_id uuid not null, body text not null check (char_length(body) between 1 and 280), archived boolean not null default false, created_at timestamptz not null default now());
create table public.reactions (user_id uuid not null default auth.uid(), target_id uuid not null, emoji text not null, primary key (user_id, target_id, emoji));
create table public.reports (id uuid primary key default gen_random_uuid(), reporter_id uuid not null default auth.uid(), target_type text not null check (target_type in ('user','comment','message')), target_id uuid not null, target_user_id uuid, reason text not null check (char_length(reason) between 1 and 500), status text not null default 'pending', created_at timestamptz not null default now());
grant select, insert, delete on public.comments, public.reactions to authenticated; grant update on public.comments to authenticated;
grant select, insert, update on public.reports to authenticated;
grant all on public.comments, public.reactions, public.reports to service_role;
alter table public.comments enable row level security; alter table public.reactions enable row level security; alter table public.reports enable row level security;
create policy "read comments" on public.comments for select to authenticated using (not archived or public.has_role(auth.uid(),'admin'));
create policy "add comment" on public.comments for insert to authenticated with check (user_id = auth.uid() and not public.is_banned(auth.uid()));
create policy "del own comment" on public.comments for delete to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin archive" on public.comments for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "read reactions" on public.reactions for select to authenticated using (true);
create policy "add reaction" on public.reactions for insert to authenticated with check (user_id = auth.uid() and not public.is_banned(auth.uid()));
create policy "del reaction" on public.reactions for delete to authenticated using (user_id = auth.uid());
create policy "create report" on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy "admin read reports" on public.reports for select to authenticated using (public.has_role(auth.uid(),'admin') or reporter_id = auth.uid());
create policy "admin update reports" on public.reports for update to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.admin_set_ban(_user uuid, _banned boolean) returns void language plpgsql security definer set search_path=public as $$
begin if not public.has_role(auth.uid(),'admin') then raise exception 'forbidden'; end if;
update public.profiles set banned=_banned where id=_user; end $$;

create table public.user_quizzes (id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid(), title text not null, description text not null default '', cover_url text, questions jsonb not null default '[]', published boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
grant select, insert, update, delete on public.user_quizzes to authenticated; grant all on public.user_quizzes to service_role;
alter table public.user_quizzes enable row level security;
create policy "read quizzes" on public.user_quizzes for select to authenticated using (published or owner_id = auth.uid());
create policy "own quizzes ins" on public.user_quizzes for insert to authenticated with check (owner_id = auth.uid() and not public.is_banned(auth.uid()));
create policy "own quizzes upd" on public.user_quizzes for update to authenticated using (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own quizzes del" on public.user_quizzes for delete to authenticated using (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- CHAT
create table public.chat_rooms (id uuid primary key default gen_random_uuid(), name text not null, kind text not null check (kind in ('general','group','dm')), created_by uuid, created_at timestamptz not null default now());
create table public.room_members (room_id uuid not null references public.chat_rooms(id) on delete cascade, user_id uuid not null, primary key (room_id, user_id));
create table public.messages (id uuid primary key default gen_random_uuid(), room_id uuid not null references public.chat_rooms(id) on delete cascade, user_id uuid not null default auth.uid(), body text not null check (char_length(body) between 1 and 1000), created_at timestamptz not null default now());
create table public.dm_requests (id uuid primary key default gen_random_uuid(), from_id uuid not null default auth.uid(), to_id uuid not null, status text not null default 'pending', room_id uuid, created_at timestamptz not null default now(), unique(from_id, to_id));
grant select, insert on public.chat_rooms, public.messages to authenticated; grant delete on public.messages to authenticated;
grant select, insert, delete on public.room_members to authenticated;
grant select, insert, update on public.dm_requests to authenticated;
grant all on public.chat_rooms, public.room_members, public.messages, public.dm_requests to service_role;
alter table public.chat_rooms enable row level security; alter table public.room_members enable row level security; alter table public.messages enable row level security; alter table public.dm_requests enable row level security;

create or replace function public.is_room_member(_room uuid, _uid uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.room_members where room_id=_room and user_id=_uid) or exists(select 1 from public.chat_rooms where id=_room and kind='general') $$;

create policy "rooms visible" on public.chat_rooms for select to authenticated using (kind='general' or public.is_room_member(id, auth.uid()) or created_by = auth.uid());
create policy "create group" on public.chat_rooms for insert to authenticated with check (kind='group' and created_by = auth.uid() and not public.is_banned(auth.uid()));
create policy "members visible" on public.room_members for select to authenticated using (public.is_room_member(room_id, auth.uid()));
create policy "creator adds members" on public.room_members for insert to authenticated with check (exists(select 1 from public.chat_rooms r where r.id=room_id and r.created_by=auth.uid() and r.kind='group'));
create policy "leave room" on public.room_members for delete to authenticated using (user_id = auth.uid());
create policy "read messages" on public.messages for select to authenticated using (public.is_room_member(room_id, auth.uid()));
create policy "send messages" on public.messages for insert to authenticated with check (user_id = auth.uid() and public.is_room_member(room_id, auth.uid()) and not public.is_banned(auth.uid()));
create policy "delete messages" on public.messages for delete to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "see dm req" on public.dm_requests for select to authenticated using (from_id = auth.uid() or to_id = auth.uid());
create policy "send dm req" on public.dm_requests for insert to authenticated with check (from_id = auth.uid() and to_id <> auth.uid() and not public.is_banned(auth.uid()));

create or replace function public.respond_dm(_req uuid, _accept boolean) returns uuid language plpgsql security definer set search_path=public as $$
declare r record; rid uuid;
begin
  select * into r from public.dm_requests where id=_req and to_id=auth.uid() and status='pending';
  if not found then raise exception 'not found'; end if;
  if _accept then
    insert into public.chat_rooms(name, kind, created_by) values ('DM','dm', r.from_id) returning id into rid;
    insert into public.room_members values (rid, r.from_id), (rid, r.to_id);
    update public.dm_requests set status='accepted', room_id=rid where id=_req;
  else update public.dm_requests set status='declined' where id=_req; end if;
  return rid;
end $$;

insert into public.chat_rooms(id, name, kind) values ('00000000-0000-0000-0000-000000000001','Grupo Geral','general');
alter publication supabase_realtime add table public.messages;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
