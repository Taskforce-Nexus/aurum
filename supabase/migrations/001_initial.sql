-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Projects table
create table if not exists public.projects (
  id                        uuid primary key default uuid_generate_v4(),
  name                      text not null,
  user_id                   uuid not null references auth.users(id) on delete cascade,
  status                    text not null default 'active',
  incubation_mode           text,
  founder_brief             text,
  entry_level               text not null default 'raw_idea' check (entry_level in ('raw_idea', 'has_prd', 'has_partial')),
  current_phase             text default 'Semilla',
  last_active_at            timestamptz default now(),
  aurum_value_proposition   text,
  aurum_business_model      text,
  aurum_branding            text,
  aurum_customer_journey    text,
  aurum_business_plan       text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- Conversations table
create table if not exists public.conversations (
  id               uuid primary key default uuid_generate_v4(),
  project_id       uuid not null references public.projects(id) on delete cascade,
  phase            text not null default 'semilla',
  messages         jsonb not null default '[]'::jsonb,
  extracted_docs   jsonb,
  progress         jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Proxy responses table
create table if not exists public.proxy_responses (
  id                uuid primary key default uuid_generate_v4(),
  project_id        uuid not null references public.projects(id) on delete cascade,
  conversation_id   uuid references public.conversations(id) on delete set null,
  phase             text,
  trigger_messages  jsonb,
  draft_content     text,
  critique_content  text,
  final_content     text,
  agreement         boolean,
  edited_content    text,
  status            text default 'pending' check (status in ('pending', 'approved', 'discarded', 'chosen')),
  created_at        timestamptz not null default now(),
  reviewed_at       timestamptz
);

-- RLS policies
alter table public.projects enable row level security;
alter table public.conversations enable row level security;
alter table public.proxy_responses enable row level security;

-- Projects policies
create policy "Users can view their own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert their own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete their own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Conversations policies
create policy "Users can view their project conversations"
  on public.conversations for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = conversations.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can insert conversations for their projects"
  on public.conversations for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = conversations.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can update their project conversations"
  on public.conversations for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = conversations.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Proxy responses policies
create policy "Users can view their proxy responses"
  on public.proxy_responses for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = proxy_responses.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can insert proxy responses"
  on public.proxy_responses for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = proxy_responses.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Updated_at trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated_at
  before update on public.projects
  for each row execute function update_updated_at();

create trigger conversations_updated_at
  before update on public.conversations
  for each row execute function update_updated_at();
