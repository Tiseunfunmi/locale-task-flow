-- ============================================================
-- TaskMate Core Schema Migration
-- Creates: profiles, bookings, messages, reviews, wallet_transactions
-- Includes: RLS policies, indexes, and auto-profile trigger
-- ============================================================

-- 1. PROFILES TABLE
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'completer', 'admin')),
  bio text,
  service_area text,
  services text[] default '{}',
  rating numeric(3,2) default 0.00,
  total_ratings integer default 0,
  balance integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for profiles
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_service_area on public.profiles(service_area);
create index if not exists idx_profiles_services on public.profiles using gin(services);
create index if not exists idx_profiles_rating on public.profiles(rating desc);

-- Enable RLS
alter table public.profiles enable row level security;

-- RLS Policies for profiles
-- All authenticated users can read all profiles (needed for browsing completers)
create policy profiles_select_all on public.profiles
  for select to authenticated
  using (true);

-- Users can update only their own profile
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Users can insert only their own profile (used by trigger)
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

-- Service role (edge functions) can do anything
create policy profiles_service_all on public.profiles
  for all to service_role
  using (true)
  with check (true);


-- 2. BOOKINGS TABLE
-- ============================================================
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  completer_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'awaiting_release', 'completed', 'cancelled', 'disputed')),
  price integer not null check (price >= 0),
  chore_type text not null,
  description text,
  scheduled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for bookings
create index if not exists idx_bookings_customer on public.bookings(customer_id);
create index if not exists idx_bookings_completer on public.bookings(completer_id);
create index if not exists idx_bookings_status on public.bookings(status);
create index if not exists idx_bookings_created on public.bookings(created_at desc);

-- Enable RLS
alter table public.bookings enable row level security;

-- RLS Policies for bookings
-- Customer and completer can read their own bookings
create policy bookings_select_parties on public.bookings
  for select to authenticated
  using (customer_id = auth.uid() or completer_id = auth.uid());

-- Customer can create bookings
create policy bookings_insert_customer on public.bookings
  for insert to authenticated
  with check (customer_id = auth.uid());

-- Customer can update (e.g., mark complete, cancel)
-- Completer can update (e.g., mark in_progress)
create policy bookings_update_parties on public.bookings
  for update to authenticated
  using (customer_id = auth.uid() or completer_id = auth.uid())
  with check (customer_id = auth.uid() or completer_id = auth.uid());

-- Service role full access
create policy bookings_service_all on public.bookings
  for all to service_role
  using (true)
  with check (true);


-- 3. MESSAGES TABLE
-- ============================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Indexes for messages
create index if not exists idx_messages_booking on public.messages(booking_id);
create index if not exists idx_messages_sender on public.messages(sender_id);
create index if not exists idx_messages_receiver on public.messages(receiver_id);
create index if not exists idx_messages_created on public.messages(created_at desc);
-- Composite index for fetching conversation threads efficiently
create index if not exists idx_messages_conversation on public.messages(sender_id, receiver_id, created_at desc);

-- Enable RLS
alter table public.messages enable row level security;

-- RLS Policies for messages
-- Users can read messages they sent or received
create policy messages_select_own on public.messages
  for select to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

-- Users can send messages (insert where they are the sender)
create policy messages_insert_sender on public.messages
  for insert to authenticated
  with check (sender_id = auth.uid());

-- Service role full access
create policy messages_service_all on public.messages
  for all to service_role
  using (true)
  with check (true);


-- 4. REVIEWS TABLE
-- ============================================================
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  completer_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now()
);

-- Indexes for reviews
create index if not exists idx_reviews_completer on public.reviews(completer_id);
create index if not exists idx_reviews_customer on public.reviews(customer_id);
create index if not exists idx_reviews_rating on public.reviews(rating);

-- Enable RLS
alter table public.reviews enable row level security;

-- RLS Policies for reviews
-- Anyone authenticated can read reviews (for displaying on completer profiles)
create policy reviews_select_all on public.reviews
  for select to authenticated
  using (true);

-- Only the customer of a completed booking can create a review
create policy reviews_insert_customer on public.reviews
  for insert to authenticated
  with check (
    customer_id = auth.uid()
    and exists (
      select 1 from public.bookings
      where bookings.id = reviews.booking_id
        and bookings.customer_id = auth.uid()
        and bookings.status = 'completed'
    )
  );

-- Service role full access
create policy reviews_service_all on public.reviews
  for all to service_role
  using (true)
  with check (true);


-- 5. WALLET TRANSACTIONS TABLE
-- ============================================================
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null check (amount > 0),
  type text not null check (type in ('credit', 'debit')),
  description text not null,
  reference_id uuid,
  created_at timestamptz default now()
);

-- Indexes for wallet_transactions
create index if not exists idx_wallet_profile on public.wallet_transactions(profile_id);
create index if not exists idx_wallet_type on public.wallet_transactions(type);
create index if not exists idx_wallet_created on public.wallet_transactions(created_at desc);

-- Enable RLS
alter table public.wallet_transactions enable row level security;

-- RLS Policies for wallet_transactions
-- Users can only read their own transactions
create policy wallet_select_own on public.wallet_transactions
  for select to authenticated
  using (profile_id = auth.uid());

-- Only service role can insert (triggered by business logic in edge functions)
create policy wallet_insert_service on public.wallet_transactions
  for insert to service_role
  with check (true);

-- Service role full access
create policy wallet_service_all on public.wallet_transactions
  for all to service_role
  using (true)
  with check (true);


-- 6. AUTO-PROFILE CREATION TRIGGER
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  );
  return new;
end;
$$;

-- Drop trigger if exists (idempotent)
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();


-- 7. UPDATED_AT TRIGGER FUNCTION
-- ============================================================
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at triggers
create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.update_updated_at();

create trigger bookings_updated_at
  before update on public.bookings
  for each row
  execute function public.update_updated_at();


-- 8. REVIEW BONUS POINTS FUNCTION
-- ============================================================
create or replace function public.handle_review_bonus()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- If rating is 4 or 5, credit 100 bonus points
  if new.rating >= 4 then
    insert into public.wallet_transactions (profile_id, amount, type, description, reference_id)
    values (new.completer_id, 100, 'credit', 'Bonus points for ' || new.rating || '-star rating', new.id);

    update public.profiles
    set balance = balance + 100
    where id = new.completer_id;
  end if;

  -- Update completer average rating
  update public.profiles
  set
    total_ratings = total_ratings + 1,
    rating = (
      select coalesce(avg(r.rating), 0)
      from public.reviews r
      where r.completer_id = new.completer_id
    )
  where id = new.completer_id;

  return new;
end;
$$;

-- Drop trigger if exists (idempotent)
drop trigger if exists on_review_created on public.reviews;

-- Create trigger for review bonus
create trigger on_review_created
  after insert on public.reviews
  for each row
  execute function public.handle_review_bonus();


-- 9. BOOKING COMPLETION - RELEASE FUNDS FUNCTION
-- ============================================================
create or replace function public.complete_booking_and_release_funds(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking record;
  v_commission integer;
  v_completer_amount integer;
begin
  select * into v_booking from public.bookings where id = p_booking_id;

  if v_booking is null then
    raise exception 'Booking not found';
  end if;

  if v_booking.status != 'awaiting_release' then
    raise exception 'Booking is not awaiting release';
  end if;

  -- Calculate commission (12% default)
  v_commission := (v_booking.price * 12) / 100;
  v_completer_amount := v_booking.price - v_commission;

  -- Update booking status
  update public.bookings
  set status = 'completed', completed_at = now(), updated_at = now()
  where id = p_booking_id;

  -- Credit completer
  insert into public.wallet_transactions (profile_id, amount, type, description, reference_id)
  values (v_booking.completer_id, v_completer_amount, 'credit', 'Payment for booking: ' || v_booking.chore_type, p_booking_id);

  update public.profiles
  set balance = balance + v_completer_amount
  where id = v_booking.completer_id;

  -- Record platform commission
  insert into public.wallet_transactions (profile_id, amount, type, description, reference_id)
  values (v_booking.completer_id, v_commission, 'debit', 'Platform commission (12%)', p_booking_id);
end;
$$;
