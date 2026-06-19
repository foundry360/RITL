-- Abandoned checkout reminders (Phase 1: email captured at checkout, no purchase within 3 days).

create table if not exists public.abandoned_checkouts (
  id uuid primary key default gen_random_uuid(),

  email text not null unique,
  checkout_reference text,
  items jsonb not null default '[]'::jsonb,
  amount_cents integer not null default 0,
  currency text not null default 'usd',

  last_activity_at timestamptz not null default now(),
  reminder_sent_at timestamptz,
  converted_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists abandoned_checkouts_reminder_idx
  on public.abandoned_checkouts (last_activity_at)
  where converted_at is null and reminder_sent_at is null;

alter table public.abandoned_checkouts enable row level security;

create or replace function public.set_abandoned_checkouts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists abandoned_checkouts_set_updated_at on public.abandoned_checkouts;

create trigger abandoned_checkouts_set_updated_at
before update on public.abandoned_checkouts
for each row
execute function public.set_abandoned_checkouts_updated_at();
