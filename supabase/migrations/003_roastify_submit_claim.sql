-- Prevent duplicate Roastify submissions when checkout success and Stripe webhook run concurrently.

alter table orders
  add column if not exists roastify_submit_claimed_at timestamptz;

create index if not exists orders_roastify_submit_claim_idx
  on public.orders (stripe_payment_intent_id)
  where roastify_order_id is null and roastify_submit_claimed_at is null;
