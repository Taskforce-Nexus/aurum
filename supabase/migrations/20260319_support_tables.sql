-- Story 7.2 — Support system tables (already created in Supabase)
-- This migration documents the expected schema.

create table if not exists public.support_tickets (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  subject       text not null,
  description   text not null,
  status        text not null default 'abierto'
    check (status in ('abierto', 'escalado', 'resuelto', 'cerrado')),
  priority      text not null default 'normal'
    check (priority in ('urgente', 'normal', 'bajo')),
  aria_resolved boolean default false,
  assigned_to   uuid references auth.users(id),
  project_id    uuid references public.projects(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.ticket_messages (
  id          uuid primary key default uuid_generate_v4(),
  ticket_id   uuid not null references public.support_tickets(id) on delete cascade,
  sender_id   uuid not null references auth.users(id),
  sender_role text not null check (sender_role in ('user', 'aria', 'admin')),
  content     text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.feature_requests (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text,
  status      text not null default 'recibida'
    check (status in ('recibida', 'evaluada', 'planeada', 'implementada', 'descartada')),
  votes       integer not null default 0,
  admin_notes text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.feature_votes (
  id         uuid primary key default uuid_generate_v4(),
  feature_id uuid not null references public.feature_requests(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (feature_id, user_id)
);

-- Indexes
create index if not exists idx_support_tickets_user on public.support_tickets(user_id);
create index if not exists idx_support_tickets_status on public.support_tickets(status);
create index if not exists idx_ticket_messages_ticket on public.ticket_messages(ticket_id);
create index if not exists idx_feature_requests_votes on public.feature_requests(votes desc);
create index if not exists idx_feature_votes_feature on public.feature_votes(feature_id);
