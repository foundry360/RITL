-- Orders: source of truth for fulfillment status and customer notifications.
-- Apply in Supabase Dashboard → SQL Editor, or via `supabase db push` if using CLI.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),

  source text not null default 'website'
    check (source in ('website', 'wholesale')),

  stripe_payment_intent_id text unique,
  stripe_customer_id text,

  amount_cents integer not null default 0,
  currency text not null default 'usd',
  order_type text check (order_type in ('one-time', 'subscription', 'mixed')),

  customer_name text,
  customer_email text,
  shipping_address text,
  items jsonb not null default '[]'::jsonb,

  roastify_order_id text unique,
  fulfillment_status text,
  tracking_number text,
  tracking_url text,
  carrier text,
  roastify_updated_at timestamptz,

  confirmation_email_sent_at timestamptz,
  stage_emails_sent text[] not null default '{}'::text[],
  webhook_ids_processed text[] not null default '{}'::text[],

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx
  on public.orders (created_at desc);

create index if not exists orders_fulfillment_status_idx
  on public.orders (fulfillment_status);

create index if not exists orders_customer_email_idx
  on public.orders (customer_email);

create index if not exists orders_roastify_order_id_idx
  on public.orders (roastify_order_id);

create index if not exists orders_customer_name_idx
  on public.orders (customer_name);

alter table public.orders enable row level security;

-- No public policies: app uses service role in API routes and webhooks.

create or replace function public.set_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;

create trigger orders_set_updated_at
before update on public.orders
for each row
execute function public.set_orders_updated_at();
