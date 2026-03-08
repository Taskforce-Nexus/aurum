-- Organizations table
create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Organization members table
create table if not exists public.organization_members (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  role             text not null default 'member'
                   check (role in ('owner', 'cofounder', 'advisor', 'member')),
  created_at       timestamptz not null default now(),
  unique (organization_id, user_id)
);

-- Add organization_id to projects
alter table public.projects
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

-- RLS
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

create policy "members can view their organizations"
  on public.organizations for select
  using (
    id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
    )
  );

create policy "owners can update their organizations"
  on public.organizations for update
  using (owner_id = auth.uid());

create policy "members can view memberships"
  on public.organization_members for select
  using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
    )
  );

-- Auto-create organization on new user signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  org_id   uuid;
  org_slug text;
  org_name text;
begin
  org_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  );
  org_slug := lower(regexp_replace(
    split_part(new.email, '@', 1),
    '[^a-z0-9]', '-', 'g'
  )) || '-' || substr(new.id::text, 1, 8);

  insert into public.organizations (name, slug, owner_id)
  values (org_name, org_slug, new.id)
  returning id into org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (org_id, new.id, 'owner');

  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at trigger for organizations
create trigger organizations_updated_at
  before update on public.organizations
  for each row execute function update_updated_at();
