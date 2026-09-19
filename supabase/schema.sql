-- BuildCircle MVP schema. Run in Supabase SQL Editor after creating a project.
create extension if not exists "uuid-ossp";

create type public.join_mode as enum ('public', 'approval', 'invite_only');
create type public.member_role as enum ('owner', 'admin', 'moderator', 'event_manager', 'member');
create type public.channel_type as enum ('text', 'announcement', 'qa', 'showcase');
create type public.registration_mode as enum ('internal', 'external');
create type public.event_kind as enum ('workshop', 'hackathon', 'meetup', 'webinar', 'conference', 'competition', 'ama', 'demo_day', 'community_event');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  username text unique,
  avatar_url text,
  bio text,
  organization text,
  location text,
  skills text[] not null default '{}',
  interests text[] not null default '{}',
  website text,
  github_url text,
  linkedin_url text,
  created_at timestamptz not null default now()
);

create table public.communities (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text not null,
  logo_url text,
  cover_url text,
  category text not null,
  tags text[] not null default '{}',
  rules text,
  join_mode public.join_mode not null default 'public',
  settings jsonb not null default '{"allow_everyone_mention": false, "members_can_create_events": false}',
  created_at timestamptz not null default now()
);

create table public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

create table public.join_requests (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  note text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (community_id, user_id)
);

create table public.invite_links (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references public.communities(id) on delete cascade,
  token text not null unique,
  created_by uuid not null references public.profiles(id),
  expires_at timestamptz,
  max_uses integer,
  uses integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.channels (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references public.communities(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  type public.channel_type not null default 'text',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (community_id, slug)
);

create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.messages(id) on delete cascade,
  body text,
  kind text not null default 'message' check (kind in ('message','question','showcase','announcement')),
  metadata jsonb not null default '{}',
  is_pinned boolean not null default false,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.message_attachments (
  id uuid primary key default uuid_generate_v4(),
  message_id uuid not null references public.messages(id) on delete cascade,
  storage_path text not null,
  mime_type text not null,
  size_bytes integer,
  created_at timestamptz not null default now()
);

create table public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references public.communities(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text not null,
  tech_stack text[] not null default '{}',
  links jsonb not null default '{}',
  media_paths text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid references public.communities(id) on delete set null,
  host_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  cover_url text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  venue text,
  online_url text,
  capacity integer,
  kind public.event_kind not null default 'community_event',
  tags text[] not null default '{}',
  registration_mode public.registration_mode not null default 'internal',
  external_registration_url text,
  registration_fields jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table public.event_registrations (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  organization text,
  answers jsonb not null default '{}',
  qr_token text not null unique,
  status text not null default 'registered' check (status in ('registered','cancelled','waitlisted')),
  checked_in_at timestamptz,
  checked_in_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(event_id, email)
);

create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  community_id uuid references public.communities(id) on delete set null,
  target_type text not null check (target_type in ('message','user','community','event')),
  target_id uuid not null,
  reason text not null check (reason in ('spam','harassment','scam','inappropriate_content','misleading_content','other')),
  details text,
  ai_flag jsonb,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now()
);

-- Helper checks the caller's membership and role without exposing a broad table policy.
create or replace function public.is_community_staff(target_community uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.community_members
    where community_id = target_community and user_id = auth.uid()
    and role in ('owner','admin','moderator','event_manager')
  );
$$;

alter table public.profiles enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.join_requests enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;
alter table public.message_attachments enable row level security;
alter table public.message_reactions enable row level security;
alter table public.projects enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;

create policy "profiles are visible" on public.profiles for select using (true);
create policy "users update their profile" on public.profiles for update using (id = auth.uid());
create policy "communities visible" on public.communities for select using (join_mode = 'public' or exists (select 1 from public.community_members m where m.community_id = id and m.user_id = auth.uid()));
create policy "authenticated users create communities" on public.communities for insert with check (owner_id = auth.uid());
create policy "staff update communities" on public.communities for update using (public.is_community_staff(id));
create policy "members visible to members" on public.community_members for select using (exists (select 1 from public.community_members m where m.community_id = community_members.community_id and m.user_id = auth.uid()));
create policy "staff manage membership" on public.community_members for all using (public.is_community_staff(community_id));
create policy "own requests visible" on public.join_requests for select using (user_id = auth.uid() or public.is_community_staff(community_id));
create policy "submit own request" on public.join_requests for insert with check (user_id = auth.uid());
create policy "staff review requests" on public.join_requests for update using (public.is_community_staff(community_id));
create policy "channels visible to members" on public.channels for select using (exists (select 1 from public.community_members m where m.community_id = channels.community_id and m.user_id = auth.uid()));
create policy "staff manage channels" on public.channels for all using (public.is_community_staff(community_id));
create policy "messages visible to members" on public.messages for select using (exists (select 1 from public.channels c join public.community_members m on m.community_id = c.community_id where c.id = messages.channel_id and m.user_id = auth.uid()));
create policy "members post messages" on public.messages for insert with check (author_id = auth.uid() and exists (select 1 from public.channels c join public.community_members m on m.community_id = c.community_id where c.id = channel_id and m.user_id = auth.uid()));
create policy "authors edit own messages" on public.messages for update using (author_id = auth.uid());
create policy "attachments follow message visibility" on public.message_attachments for select using (exists (select 1 from public.messages m join public.channels c on c.id = m.channel_id join public.community_members cm on cm.community_id = c.community_id where m.id = message_id and cm.user_id = auth.uid()));
create policy "reaction participants" on public.message_reactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "projects visible to community members" on public.projects for select using (exists (select 1 from public.community_members m where m.community_id = projects.community_id and m.user_id = auth.uid()));
create policy "members publish projects" on public.projects for insert with check (author_id = auth.uid());
create policy "events visible" on public.events for select using (true);
create policy "hosts manage events" on public.events for all using (host_id = auth.uid() or (community_id is not null and public.is_community_staff(community_id)));
create policy "registrants see own passes" on public.event_registrations for select using (user_id = auth.uid() or exists (select 1 from public.events e where e.id = event_id and e.host_id = auth.uid()));
create policy "users register" on public.event_registrations for insert with check (user_id = auth.uid());
create policy "hosts check in" on public.event_registrations for update using (exists (select 1 from public.events e where e.id = event_id and (e.host_id = auth.uid() or (e.community_id is not null and public.is_community_staff(e.community_id)))));
create policy "users see own notifications" on public.notifications for select using (user_id = auth.uid());
create policy "users read own notifications" on public.notifications for update using (user_id = auth.uid());
create policy "authenticated users file reports" on public.reports for insert with check (reporter_id = auth.uid());
create policy "staff see reports" on public.reports for select using (public.is_community_staff(community_id));

-- Realtime feeds for channel messages and timely attendee updates.
alter publication supabase_realtime add table public.messages, public.message_reactions, public.event_registrations, public.notifications;
