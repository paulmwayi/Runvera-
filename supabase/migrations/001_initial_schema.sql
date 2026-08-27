-- ============================================================
-- Runvera – Supabase schema migration
-- ============================================================

-- 1. Businesses table
create table if not exists public.businesses (
  id              integer generated always as identity primary key,
  owner_user_id   text not null unique,          -- Supabase auth.uid() as text
  name            text not null,
  industry        text not null default '',
  currency        text not null default 'USD',
  cash_balance_cents          integer not null default 0,
  monthly_revenue_cents       integer not null default 0,
  monthly_expenses_cents      integer not null default 0,
  net_profit_cents            integer not null default 0,
  assets_cents                integer not null default 0,
  liabilities_cents           integer not null default 0,
  monthly_growth_rate_bps     integer not null default 0,
  active_customers            integer not null default 0,
  created_at     timestamp with time zone not null default now(),
  updated_at     timestamp with time zone not null default now()
);

comment on table public.businesses is 'Business financial model per user';

-- 2. Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.businesses
  for each row
  execute function public.handle_updated_at();

-- 3. Row-level security
alter table public.businesses enable row level security;

-- Users can only read their own business
create policy "Users read own business"
  on public.businesses for select
  using (owner_user_id = auth.uid()::text);

-- Users can insert a business tied to their own user id
create policy "Users insert own business"
  on public.businesses for insert
  with check (owner_user_id = auth.uid()::text);

-- Users can update their own business
create policy "Users update own business"
  on public.businesses for update
  using (owner_user_id = auth.uid()::text)
  with check (owner_user_id = auth.uid()::text);

-- Users can delete their own business
create policy "Users delete own business"
  on public.businesses for delete
  using (owner_user_id = auth.uid()::text);
