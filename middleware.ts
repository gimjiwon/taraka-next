-- TAKARA Supabase schema draft
-- Run in Supabase SQL editor after creating a project.

create extension if not exists "pgcrypto";

create type public.user_role as enum ('customer', 'admin');
create type public.kuji_status as enum ('draft', 'active', 'paused', 'ended');
create type public.ticket_status as enum ('available', 'locked', 'sold');
create type public.queue_status as enum ('waiting', 'active', 'expired', 'done', 'cancelled');
create type public.order_status as enum ('pending', 'paid', 'failed', 'cancelled', 'refunded');
create type public.shipping_status as enum ('none', 'requested', 'preparing', 'shipped', 'delivered');
create type public.reveal_status as enum ('ready', 'one_by_one', 'all_at_once', 'done');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  login_id text unique not null,
  nickname text unique not null,
  email text unique,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.kujis (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null default '',
  price integer not null check (price >= 0),
  total_tickets integer not null check (total_tickets > 0),
  status public.kuji_status not null default 'draft',
  last_one_prize_name text,
  image_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.prizes (
  id uuid primary key default gen_random_uuid(),
  kuji_id uuid not null references public.kujis(id) on delete cascade,
  rank text not null,
  name text not null,
  description text not null default '',
  quantity integer not null check (quantity > 0),
  image_url text,
  created_at timestamptz not null default now()
);

create table public.kuji_tickets (
  id uuid primary key default gen_random_uuid(),
  kuji_id uuid not null references public.kujis(id) on delete cascade,
  ticket_no integer not null check (ticket_no > 0),
  prize_id uuid references public.prizes(id),
  status public.ticket_status not null default 'available',
  locked_by uuid references public.profiles(id),
  locked_until timestamptz,
  sold_to uuid references public.profiles(id),
  sold_order_id uuid,
  sold_at timestamptz,
  created_at timestamptz not null default now(),
  unique (kuji_id, ticket_no)
);

create table public.queue_entries (
  id uuid primary key default gen_random_uuid(),
  kuji_id uuid not null references public.kujis(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.queue_status not null default 'waiting',
  position_no bigint generated always as identity,
  active_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique not null,
  user_id uuid not null references public.profiles(id),
  kuji_id uuid not null references public.kujis(id),
  amount integer not null check (amount >= 0),
  status public.order_status not null default 'pending',
  payment_provider text,
  payment_id text,
  paid_at timestamptz,
  reveal_status public.reveal_status not null default 'ready',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.kuji_tickets
  add constraint kuji_tickets_sold_order_id_fkey foreign key (sold_order_id) references public.orders(id) on delete set null;

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  ticket_id uuid not null references public.kuji_tickets(id),
  prize_id uuid references public.prizes(id),
  reveal_index integer,
  revealed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (order_id, ticket_id)
);

create table public.storage_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  order_item_id uuid not null references public.order_items(id),
  prize_id uuid references public.prizes(id),
  shipping_status public.shipping_status not null default 'none',
  created_at timestamptz not null default now(),
  unique (order_item_id)
);

create table public.shipping_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  recipient_name text not null,
  phone text not null,
  address1 text not null,
  address2 text,
  postal_code text,
  memo text,
  status public.shipping_status not null default 'requested',
  tracking_no text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shipping_request_items (
  shipping_request_id uuid references public.shipping_requests(id) on delete cascade,
  storage_item_id uuid references public.storage_items(id) on delete cascade,
  primary key (shipping_request_id, storage_item_id)
);

create table public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  target_user_id uuid references public.profiles(id),
  action text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_kuji_tickets_kuji_status on public.kuji_tickets(kuji_id, status);
create index idx_queue_entries_kuji_status on public.queue_entries(kuji_id, status, position_no);
create index idx_orders_user_created on public.orders(user_id, created_at desc);
create index idx_storage_items_user on public.storage_items(user_id, shipping_status);

-- Server-side ticket reservation. This prevents two customers from selecting the same number.
create or replace function public.reserve_ticket(
  p_kuji_id uuid,
  p_ticket_no integer,
  p_user_id uuid,
  p_hold_seconds integer default 120
)
returns public.kuji_tickets
language plpgsql
security definer
as $$
declare
  v_ticket public.kuji_tickets;
begin
  update public.kuji_tickets
     set status = 'available', locked_by = null, locked_until = null
   where kuji_id = p_kuji_id
     and status = 'locked'
     and locked_until < now();

  select * into v_ticket
    from public.kuji_tickets
   where kuji_id = p_kuji_id and ticket_no = p_ticket_no
   for update;

  if not found then
    raise exception 'ticket_not_found';
  end if;

  if v_ticket.status = 'sold' then
    raise exception 'ticket_already_sold';
  end if;

  if v_ticket.status = 'locked' and v_ticket.locked_until > now() and v_ticket.locked_by <> p_user_id then
    raise exception 'ticket_locked_by_other_user';
  end if;

  update public.kuji_tickets
     set status = 'locked', locked_by = p_user_id, locked_until = now() + make_interval(secs => p_hold_seconds)
   where id = v_ticket.id
   returning * into v_ticket;

  return v_ticket;
end;
$$;

-- Finalize a paid order and mark locked tickets as sold.
create or replace function public.finalize_paid_order(
  p_order_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
as $$
begin
  update public.orders
     set status = 'paid', paid_at = now(), updated_at = now()
   where id = p_order_id and user_id = p_user_id;

  update public.kuji_tickets t
     set status = 'sold', sold_to = p_user_id, sold_order_id = p_order_id, sold_at = now(), locked_until = null
   from public.order_items oi
   where oi.order_id = p_order_id and oi.ticket_id = t.id and t.locked_by = p_user_id;

  insert into public.storage_items (user_id, order_item_id, prize_id)
  select p_user_id, oi.id, oi.prize_id
    from public.order_items oi
   where oi.order_id = p_order_id
  on conflict (order_item_id) do nothing;
end;
$$;

alter table public.profiles enable row level security;
alter table public.kujis enable row level security;
alter table public.prizes enable row level security;
alter table public.kuji_tickets enable row level security;
alter table public.queue_entries enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.storage_items enable row level security;
alter table public.shipping_requests enable row level security;
alter table public.shipping_request_items enable row level security;
alter table public.admin_logs enable row level security;

-- Starter policies. Tighten before production.
create policy "public active kujis readable" on public.kujis for select using (status = 'active');
create policy "public prizes readable" on public.prizes for select using (true);
create policy "public tickets readable" on public.kuji_tickets for select using (true);
create policy "own profile readable" on public.profiles for select using (auth.uid() = id);
create policy "own orders readable" on public.orders for select using (auth.uid() = user_id);
create policy "own order items readable" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid())
);
create policy "own storage readable" on public.storage_items for select using (auth.uid() = user_id);
create policy "own shipping readable" on public.shipping_requests for select using (auth.uid() = user_id);
