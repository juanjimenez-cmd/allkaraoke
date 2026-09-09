-- SaaS foundation: accounts, memberships and an immutable audit trail.
-- This migration expects Supabase Auth to own auth.users.

create schema if not exists app;

create type app.account_kind as enum ('personal', 'organization');
create type app.membership_role as enum ('owner', 'admin', 'member');
create type app.account_status as enum ('active', 'suspended', 'closed');

create table app.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  kind app.account_kind not null,
  status app.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create table app.memberships (
  account_id uuid not null references app.accounts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role app.membership_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (account_id, user_id)
);

create index memberships_user_id_idx on app.memberships (user_id);
create index accounts_status_idx on app.accounts (status);

create table app.audit_events (
  id bigint generated always as identity primary key,
  account_id uuid references app.accounts(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) between 1 and 120),
  resource_type text not null check (char_length(resource_type) between 1 and 120),
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index audit_events_account_occurred_at_idx on app.audit_events (account_id, occurred_at desc);
create index audit_events_actor_occurred_at_idx on app.audit_events (actor_user_id, occurred_at desc);

create or replace function app.set_updated_at()
returns trigger
language plpgsql
set search_path = app, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger accounts_set_updated_at
before update on app.accounts
for each row execute function app.set_updated_at();

create trigger memberships_set_updated_at
before update on app.memberships
for each row execute function app.set_updated_at();

create or replace function app.prevent_orphaned_account()
returns trigger
language plpgsql
set search_path = app, pg_temp
as $$
begin
  if old.role = 'owner'
    and (tg_op = 'DELETE' or new.role <> 'owner')
    and not exists (
      select 1
      from app.memberships
      where account_id = old.account_id
        and user_id <> old.user_id
        and role = 'owner'
    ) then
    raise exception 'An account must retain at least one owner';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger memberships_prevent_orphaned_account
before update or delete on app.memberships
for each row execute function app.prevent_orphaned_account();

-- Worker transactions set this value after validating the authenticated session.
-- Policies return false when no verified user context has been established.
create or replace function app.current_user_id()
returns uuid
language sql
stable
set search_path = app, pg_temp
as $$
  select nullif(current_setting('app.current_user_id', true), '')::uuid;
$$;

create or replace function app.is_account_member(target_account_id uuid)
returns boolean
language sql
stable
security definer
set search_path = app, pg_temp
as $$
  select exists (
    select 1
    from app.memberships
    where account_id = target_account_id
      and user_id = app.current_user_id()
  );
$$;

create or replace function app.has_account_role(
  target_account_id uuid,
  allowed_roles app.membership_role[]
)
returns boolean
language sql
stable
security definer
set search_path = app, pg_temp
as $$
  select exists (
    select 1
    from app.memberships
    where account_id = target_account_id
      and user_id = app.current_user_id()
      and role = any(allowed_roles)
  );
$$;

alter table app.accounts enable row level security;
alter table app.memberships enable row level security;
alter table app.audit_events enable row level security;

create policy "members can read their accounts"
on app.accounts for select
using (app.is_account_member(id));

create policy "owners and admins can update their active accounts"
on app.accounts for update
using (status = 'active' and app.has_account_role(id, array['owner', 'admin']::app.membership_role[]))
with check (status = 'active' and app.has_account_role(id, array['owner', 'admin']::app.membership_role[]));

create policy "members can read memberships in their accounts"
on app.memberships for select
using (app.is_account_member(account_id));

create policy "owners and admins can add memberships"
on app.memberships for insert
with check (app.has_account_role(account_id, array['owner', 'admin']::app.membership_role[]));

create policy "owners and admins can update memberships"
on app.memberships for update
using (app.has_account_role(account_id, array['owner', 'admin']::app.membership_role[]))
with check (app.has_account_role(account_id, array['owner', 'admin']::app.membership_role[]));

create policy "owners and admins can remove memberships"
on app.memberships for delete
using (app.has_account_role(account_id, array['owner', 'admin']::app.membership_role[]));

create policy "members can read their account audit events"
on app.audit_events for select
using (app.is_account_member(account_id));

revoke all on schema app from public;
grant usage on schema app to authenticated, service_role;
grant select, insert, update, delete on app.accounts, app.memberships to authenticated, service_role;
grant select on app.audit_events to authenticated, service_role;
grant insert on app.audit_events to service_role;
grant usage, select on sequence app.audit_events_id_seq to service_role;
