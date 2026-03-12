-- ============================================================
-- Reason — Schema completo v1
-- Migration 005: todas las entidades de reason_entities.md
-- ============================================================

-- ============================================================
-- EXTENSIONES
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extiende auth.users)
-- ============================================================
create table if not exists public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  name                  text not null default '',
  avatar_url            text,
  language              text not null default 'es',
  timezone              text not null default 'America/Monterrey',
  notifications_email   boolean not null default true,
  voice_mode_default    boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Auto-crear profile al registrar usuario
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- PROJECTS (ampliar tabla existente)
-- ============================================================
alter table public.projects
  add column if not exists description        text,
  add column if not exists owner_id           uuid references auth.users(id) on delete cascade,
  add column if not exists entry_level        text default 'idea_cruda'
    check (entry_level in ('idea_cruda', 'algo_avanzado', 'documentacion_lista')),
  add column if not exists purpose            text,
  add column if not exists venture_profile    jsonb default '{}'::jsonb,
  add column if not exists seed_completed     boolean not null default false,
  add column if not exists github_repo        text;

-- Migrar user_id → owner_id si user_id existe
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'projects' and column_name = 'user_id')
     and not exists (select 1 from information_schema.columns
                     where table_schema = 'public' and table_name = 'projects' and column_name = 'owner_id'
                     and is_nullable = 'YES')
  then
    update public.projects set owner_id = user_id where owner_id is null;
  end if;
end $$;

-- ============================================================
-- TEAM MEMBERS
-- ============================================================
create table if not exists public.team_members (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  email           text not null,
  role            text not null default 'observador'
    check (role in ('fundador', 'cofundador', 'asesor', 'observador')),
  participation   decimal(5,4) default 0,
  status          text not null default 'pendiente'
    check (status in ('activo', 'pendiente', 'rechazado')),
  invited_at      timestamptz not null default now(),
  accepted_at     timestamptz
);

create index if not exists idx_team_members_project on public.team_members(project_id);
create index if not exists idx_team_members_user on public.team_members(user_id);

-- ============================================================
-- ADVISORS (catálogo global — ampliar tabla existente)
-- ============================================================
alter table public.advisors
  add column if not exists specialty          text,
  add column if not exists category           text
    check (category in ('investigacion', 'ux_producto', 'negocio', 'tecnico', 'precios')),
  add column if not exists level              text default 'apoya'
    check (level in ('lidera', 'apoya', 'observa')),
  add column if not exists element            text
    check (element in ('fuego', 'agua', 'tierra', 'aire')),
  add column if not exists communication_style text,
  add column if not exists hats               jsonb default '[]'::jsonb,
  add column if not exists bio                text,
  add column if not exists specialties_tags   jsonb default '[]'::jsonb,
  add column if not exists industries_tags    jsonb default '[]'::jsonb,
  add column if not exists experience         jsonb default '[]'::jsonb,
  add column if not exists language           text default 'Español',
  add column if not exists is_native          boolean not null default true,
  add column if not exists created_by         uuid references auth.users(id) on delete set null,
  add column if not exists avatar_url         text;

-- ============================================================
-- COFOUNDERS (catálogo global)
-- ============================================================
create table if not exists public.cofounders (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  role                text not null check (role in ('constructivo', 'critico')),
  specialty           text,
  element             text check (element in ('fuego', 'agua', 'tierra', 'aire')),
  communication_style text,
  hats                jsonb default '[]'::jsonb,
  bio                 text,
  specialties_tags    jsonb default '[]'::jsonb,
  industries_tags     jsonb default '[]'::jsonb,
  experience          jsonb default '[]'::jsonb,
  language            text default 'Español',
  is_native           boolean not null default true,
  created_by          uuid references auth.users(id) on delete set null,
  avatar_url          text,
  created_at          timestamptz not null default now()
);

-- ============================================================
-- DOCUMENT SPECS (biblioteca global)
-- ============================================================
create table if not exists public.document_specs (
  id                      uuid primary key default uuid_generate_v4(),
  name                    text not null,
  icp                     text not null default 'founder',
  strategic_decision      text,
  sections                jsonb default '[]'::jsonb,
  required_data           jsonb default '[]'::jsonb,
  key_advisors            jsonb default '[]'::jsonb,
  quality_criteria        text,
  is_custom               boolean not null default false,
  created_from_project    uuid references public.projects(id) on delete set null,
  created_at              timestamptz not null default now()
);

-- ============================================================
-- COUNCILS
-- ============================================================
create table if not exists public.councils (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null unique references public.projects(id) on delete cascade,
  status          text not null default 'configurando'
    check (status in ('configurando', 'listo', 'activo')),
  hats_coverage   jsonb not null default '{"blanco":false,"negro":false,"rojo":false,"amarillo":false,"verde":false,"azul":false}'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists idx_councils_project on public.councils(project_id);

-- ============================================================
-- COUNCIL ADVISORS (asignación)
-- ============================================================
create table if not exists public.council_advisors (
  id                  uuid primary key default uuid_generate_v4(),
  council_id          uuid not null references public.councils(id) on delete cascade,
  advisor_id          uuid not null references public.advisors(id) on delete cascade,
  level               text not null check (level in ('lidera', 'apoya', 'observa')),
  participation_pct   decimal(5,4) default 0,
  is_favorited        boolean not null default false,
  added_at            timestamptz not null default now(),
  unique (council_id, advisor_id)
);

create index if not exists idx_council_advisors_council on public.council_advisors(council_id);

-- ============================================================
-- COUNCIL COFOUNDERS (asignación)
-- ============================================================
create table if not exists public.council_cofounders (
  id              uuid primary key default uuid_generate_v4(),
  council_id      uuid not null references public.councils(id) on delete cascade,
  cofounder_id    uuid not null references public.cofounders(id) on delete cascade,
  role            text not null check (role in ('constructivo', 'critico')),
  assigned_at     timestamptz not null default now(),
  unique (council_id, cofounder_id)
);

create index if not exists idx_council_cofounders_council on public.council_cofounders(council_id);

-- ============================================================
-- SPECIALISTS (por proyecto)
-- ============================================================
create table if not exists public.specialists (
  id                  uuid primary key default uuid_generate_v4(),
  project_id          uuid not null references public.projects(id) on delete cascade,
  name                text not null,
  specialty           text,
  category_tag        text,
  justification       text,
  bio                 text,
  specialties_tags    jsonb default '[]'::jsonb,
  industries_tags     jsonb default '[]'::jsonb,
  experience          jsonb default '[]'::jsonb,
  language            text default 'Español',
  is_confirmed        boolean not null default false,
  created_at          timestamptz not null default now()
);

create index if not exists idx_specialists_project on public.specialists(project_id);

-- ============================================================
-- BUYER PERSONAS (por proyecto)
-- ============================================================
create table if not exists public.buyer_personas (
  id                      uuid primary key default uuid_generate_v4(),
  project_id              uuid not null references public.projects(id) on delete cascade,
  name                    text not null,
  archetype_label         text,
  demographics            text,
  quote                   text,
  needs                   jsonb default '[]'::jsonb,
  fears_objections        jsonb default '[]'::jsonb,
  discovery_channels      jsonb default '[]'::jsonb,
  current_alternatives    jsonb default '[]'::jsonb,
  purchase_journey        jsonb default '[]'::jsonb,
  behavior_tags           jsonb default '[]'::jsonb,
  is_confirmed            boolean not null default false,
  created_at              timestamptz not null default now()
);

create index if not exists idx_buyer_personas_project on public.buyer_personas(project_id);

-- ============================================================
-- PROJECT DOCUMENTS
-- ============================================================
create table if not exists public.project_documents (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  spec_id         uuid references public.document_specs(id) on delete set null,
  name            text not null,
  status          text not null default 'pendiente'
    check (status in ('pendiente', 'en_progreso', 'generado', 'aprobado')),
  content_json    jsonb default '{}'::jsonb,
  content_html    text,
  brand_settings  jsonb default '{}'::jsonb,
  generated_at    timestamptz,
  approved_at     timestamptz,
  last_edited_at  timestamptz
);

create index if not exists idx_project_documents_project on public.project_documents(project_id);

-- ============================================================
-- CONVERSATIONS (ampliar tabla existente)
-- ============================================================
alter table public.conversations
  add column if not exists type       text default 'semilla'
    check (type in ('semilla', 'clarificacion', 'consultoria')),
  add column if not exists metadata   jsonb default '{}'::jsonb,
  add column if not exists status     text default 'activa'
    check (status in ('activa', 'completada', 'pausada'));

-- ============================================================
-- SESSIONS (Sesión de Consejo)
-- ============================================================
create table if not exists public.sessions (
  id                        uuid primary key default uuid_generate_v4(),
  project_id                uuid not null references public.projects(id) on delete cascade,
  status                    text not null default 'activa'
    check (status in ('activa', 'completada', 'pausada')),
  mode                      text not null default 'normal'
    check (mode in ('normal', 'autopiloto', 'levantar_mano')),
  current_document_index    integer not null default 0,
  current_question_index    integer not null default 0,
  total_documents           integer not null default 0,
  created_at                timestamptz not null default now(),
  completed_at              timestamptz
);

create index if not exists idx_sessions_project on public.sessions(project_id);

-- ============================================================
-- SESSION PHASES
-- ============================================================
create table if not exists public.session_phases (
  id              uuid primary key default uuid_generate_v4(),
  session_id      uuid not null references public.sessions(id) on delete cascade,
  document_id     uuid references public.project_documents(id) on delete set null,
  phase_index     integer not null default 0,
  status          text not null default 'pendiente'
    check (status in ('pendiente', 'en_progreso', 'completada')),
  questions       jsonb not null default '[]'::jsonb,
  momentum        jsonb not null default '{"total_questions":0,"resolved":0,"constructivo_count":0,"critico_count":0}'::jsonb,
  started_at      timestamptz,
  completed_at    timestamptz
);

create index if not exists idx_session_phases_session on public.session_phases(session_id);

-- ============================================================
-- NEXO DUAL RESPONSES
-- ============================================================
create table if not exists public.nexo_dual_responses (
  id                      uuid primary key default uuid_generate_v4(),
  phase_id                uuid not null references public.session_phases(id) on delete cascade,
  question_index          integer not null default 0,
  constructive_content    text,
  constructive_hat        text,
  critical_content        text,
  critical_hat            text,
  agreement               boolean,
  resolution              text check (resolution in ('constructiva', 'critico', 'responder_yo', 'acuerdo')),
  founder_response        text,
  synthesis               text,
  created_at              timestamptz not null default now()
);

create index if not exists idx_nexo_responses_phase on public.nexo_dual_responses(phase_id);

-- ============================================================
-- CONSULTATIONS (Consultoría activa)
-- ============================================================
create table if not exists public.consultations (
  id                      uuid primary key default uuid_generate_v4(),
  project_id              uuid not null references public.projects(id) on delete cascade,
  title                   text not null default 'Nueva consulta',
  messages                jsonb not null default '[]'::jsonb,
  participating_advisors  jsonb default '[]'::jsonb,
  status                  text not null default 'activa'
    check (status in ('activa', 'cerrada')),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists idx_consultations_project on public.consultations(project_id);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
create table if not exists public.subscriptions (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null unique references auth.users(id) on delete cascade,
  plan                    text not null default 'core'
    check (plan in ('core', 'pro', 'enterprise')),
  price_monthly           decimal(10,2) not null default 0,
  status                  text not null default 'trial'
    check (status in ('activa', 'cancelada', 'trial')),
  current_period_start    timestamptz not null default now(),
  current_period_end      timestamptz not null default now() + interval '30 days',
  cancel_at               timestamptz,
  created_at              timestamptz not null default now()
);

-- ============================================================
-- TOKEN BALANCE
-- ============================================================
create table if not exists public.token_balances (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null unique references auth.users(id) on delete cascade,
  balance_usd   decimal(10,4) not null default 50.00,
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- TOKEN USAGE
-- ============================================================
create table if not exists public.token_usage (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  project_id    uuid references public.projects(id) on delete set null,
  activity      text not null,
  tokens_used   integer not null default 0,
  cost_usd      decimal(10,6) not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists idx_token_usage_user on public.token_usage(user_id);
create index if not exists idx_token_usage_project on public.token_usage(project_id);

-- ============================================================
-- INVOICES
-- ============================================================
create table if not exists public.invoices (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  concept       text not null,
  amount_usd    decimal(10,2) not null,
  status        text not null default 'pendiente'
    check (status in ('pagada', 'pendiente', 'fallida')),
  pdf_url       text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_invoices_user on public.invoices(user_id);

-- ============================================================
-- PAYMENT METHODS
-- ============================================================
create table if not exists public.payment_methods (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  type          text not null check (type in ('visa', 'mastercard', 'amex')),
  last_four     text not null,
  exp_month     integer not null,
  exp_year      integer not null,
  is_primary    boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists idx_payment_methods_user on public.payment_methods(user_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table if not exists public.notifications (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  project_id    uuid references public.projects(id) on delete cascade,
  type          text not null check (type in (
    'documento_generado', 'miembro_unido', 'saldo_bajo',
    'sesion_completada', 'consejero_disponible',
    'pago_procesado', 'factura_disponible'
  )),
  title         text not null,
  is_read       boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_unread on public.notifications(user_id, is_read) where is_read = false;

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================
create table if not exists public.notification_preferences (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null check (type in (
    'documento_generado', 'miembro_unido', 'saldo_bajo',
    'sesion_completada', 'consejero_disponible',
    'pago_procesado', 'factura_disponible'
  )),
  enabled     boolean not null default true,
  unique (user_id, type)
);

create index if not exists idx_notif_prefs_user on public.notification_preferences(user_id);

-- ============================================================
-- CONNECTIONS
-- ============================================================
create table if not exists public.connections (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  provider        text not null check (provider in ('github', 'google_drive')),
  status          text not null default 'desconectado'
    check (status in ('conectado', 'desconectado')),
  provider_data   jsonb default '{}'::jsonb,
  connected_at    timestamptz,
  unique (user_id, provider)
);

create index if not exists idx_connections_user on public.connections(user_id);

-- ============================================================
-- CONSUMPTION ALERTS
-- ============================================================
create table if not exists public.consumption_alerts (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null unique references auth.users(id) on delete cascade,
  threshold_usd   decimal(10,2) not null default 10.00,
  alert_email     boolean not null default true,
  alert_app       boolean not null default true
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Helper: check if user has access to project
create or replace function public.user_has_project_access(p_project_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.projects
    where id = p_project_id
    and (
      owner_id = auth.uid()
      or user_id = auth.uid()
      or exists (
        select 1 from public.team_members
        where project_id = p_project_id
        and user_id = auth.uid()
        and status = 'activo'
      )
    )
  );
$$;

-- PROFILES
alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid());
create policy "profiles_insert_own" on public.profiles for insert with check (id = auth.uid());

-- PROJECTS
alter table public.projects enable row level security;
drop policy if exists "projects_select" on public.projects;
drop policy if exists "projects_insert" on public.projects;
drop policy if exists "projects_update" on public.projects;
drop policy if exists "projects_delete" on public.projects;
create policy "projects_select" on public.projects for select using (
  owner_id = auth.uid() or user_id = auth.uid()
  or exists (select 1 from public.team_members where project_id = id and user_id = auth.uid() and status = 'activo')
);
create policy "projects_insert" on public.projects for insert with check (
  coalesce(owner_id, user_id) = auth.uid()
);
create policy "projects_update" on public.projects for update using (
  owner_id = auth.uid() or user_id = auth.uid()
);
create policy "projects_delete" on public.projects for delete using (
  owner_id = auth.uid() or user_id = auth.uid()
);

-- TEAM MEMBERS
alter table public.team_members enable row level security;
create policy "team_members_select" on public.team_members for select using (
  public.user_has_project_access(project_id) or user_id = auth.uid()
);
create policy "team_members_insert" on public.team_members for insert with check (
  public.user_has_project_access(project_id)
);
create policy "team_members_update" on public.team_members for update using (
  public.user_has_project_access(project_id)
);
create policy "team_members_delete" on public.team_members for delete using (
  public.user_has_project_access(project_id)
);

-- ADVISORS (catálogo global)
alter table public.advisors enable row level security;
drop policy if exists "advisors_select_all" on public.advisors;
create policy "advisors_select_all" on public.advisors for select to authenticated using (true);
create policy "advisors_insert_custom" on public.advisors for insert with check (
  is_native = false and created_by = auth.uid()
);
create policy "advisors_update_custom" on public.advisors for update using (
  is_native = false and created_by = auth.uid()
);

-- COFOUNDERS (catálogo global)
alter table public.cofounders enable row level security;
create policy "cofounders_select_all" on public.cofounders for select to authenticated using (true);
create policy "cofounders_insert_custom" on public.cofounders for insert with check (
  is_native = false and created_by = auth.uid()
);
create policy "cofounders_update_custom" on public.cofounders for update using (
  is_native = false and created_by = auth.uid()
);

-- DOCUMENT SPECS (biblioteca global)
alter table public.document_specs enable row level security;
create policy "document_specs_select_all" on public.document_specs for select to authenticated using (true);
create policy "document_specs_insert_custom" on public.document_specs for insert with check (
  is_custom = true and created_from_project is not null
  and public.user_has_project_access(created_from_project)
);

-- COUNCILS
alter table public.councils enable row level security;
create policy "councils_select" on public.councils for select using (
  public.user_has_project_access(project_id)
);
create policy "councils_insert" on public.councils for insert with check (
  public.user_has_project_access(project_id)
);
create policy "councils_update" on public.councils for update using (
  public.user_has_project_access(project_id)
);

-- COUNCIL ADVISORS
alter table public.council_advisors enable row level security;
create policy "council_advisors_access" on public.council_advisors for all using (
  exists (select 1 from public.councils c where c.id = council_id and public.user_has_project_access(c.project_id))
);

-- COUNCIL COFOUNDERS
alter table public.council_cofounders enable row level security;
create policy "council_cofounders_access" on public.council_cofounders for all using (
  exists (select 1 from public.councils c where c.id = council_id and public.user_has_project_access(c.project_id))
);

-- SPECIALISTS
alter table public.specialists enable row level security;
create policy "specialists_access" on public.specialists for all using (
  public.user_has_project_access(project_id)
);

-- BUYER PERSONAS
alter table public.buyer_personas enable row level security;
create policy "buyer_personas_access" on public.buyer_personas for all using (
  public.user_has_project_access(project_id)
);

-- PROJECT DOCUMENTS
alter table public.project_documents enable row level security;
create policy "project_documents_access" on public.project_documents for all using (
  public.user_has_project_access(project_id)
);

-- CONVERSATIONS
alter table public.conversations enable row level security;
drop policy if exists "Users can view their project conversations" on public.conversations;
drop policy if exists "Users can create conversations" on public.conversations;
create policy "conversations_access" on public.conversations for all using (
  public.user_has_project_access(project_id)
);

-- SESSIONS
alter table public.sessions enable row level security;
create policy "sessions_access" on public.sessions for all using (
  public.user_has_project_access(project_id)
);

-- SESSION PHASES
alter table public.session_phases enable row level security;
create policy "session_phases_access" on public.session_phases for all using (
  exists (select 1 from public.sessions s where s.id = session_id and public.user_has_project_access(s.project_id))
);

-- NEXO DUAL RESPONSES
alter table public.nexo_dual_responses enable row level security;
create policy "nexo_responses_access" on public.nexo_dual_responses for all using (
  exists (
    select 1 from public.session_phases sp
    join public.sessions s on s.id = sp.session_id
    where sp.id = phase_id and public.user_has_project_access(s.project_id)
  )
);

-- CONSULTATIONS
alter table public.consultations enable row level security;
create policy "consultations_access" on public.consultations for all using (
  public.user_has_project_access(project_id)
);

-- SUBSCRIPTIONS
alter table public.subscriptions enable row level security;
create policy "subscriptions_own" on public.subscriptions for all using (user_id = auth.uid());

-- TOKEN BALANCES
alter table public.token_balances enable row level security;
create policy "token_balances_own" on public.token_balances for all using (user_id = auth.uid());

-- TOKEN USAGE
alter table public.token_usage enable row level security;
create policy "token_usage_own" on public.token_usage for all using (user_id = auth.uid());

-- INVOICES
alter table public.invoices enable row level security;
create policy "invoices_own" on public.invoices for all using (user_id = auth.uid());

-- PAYMENT METHODS
alter table public.payment_methods enable row level security;
create policy "payment_methods_own" on public.payment_methods for all using (user_id = auth.uid());

-- NOTIFICATIONS
alter table public.notifications enable row level security;
create policy "notifications_own" on public.notifications for all using (user_id = auth.uid());

-- NOTIFICATION PREFERENCES
alter table public.notification_preferences enable row level security;
create policy "notif_prefs_own" on public.notification_preferences for all using (user_id = auth.uid());

-- CONNECTIONS
alter table public.connections enable row level security;
create policy "connections_own" on public.connections for all using (user_id = auth.uid());

-- CONSUMPTION ALERTS
alter table public.consumption_alerts enable row level security;
create policy "consumption_alerts_own" on public.consumption_alerts for all using (user_id = auth.uid());
