-- Create carts table
create table if not exists public.carts (
  id uuid not null default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id)
);

-- Create cart_items table
create table if not exists public.cart_items (
  id uuid not null default gen_random_uuid(),
  cart_id uuid references public.carts(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id)
);

-- Enable RLS
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

-- Policies for carts
create policy "Users can view their own cart"
  on public.carts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own cart"
  on public.carts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own cart"
  on public.carts for update
  using (auth.uid() = user_id);

-- Policies for cart_items
create policy "Users can view their own cart items"
  on public.cart_items for select
  using (
    exists (
      select 1 from public.carts
      where public.carts.id = public.cart_items.cart_id
      and public.carts.user_id = auth.uid()
    )
  );

create policy "Users can insert their own cart items"
  on public.cart_items for insert
  with check (
    exists (
      select 1 from public.carts
      where public.carts.id = public.cart_items.cart_id
      and public.carts.user_id = auth.uid()
    )
  );

create policy "Users can update their own cart items"
  on public.cart_items for update
  using (
    exists (
      select 1 from public.carts
      where public.carts.id = public.cart_items.cart_id
      and public.carts.user_id = auth.uid()
    )
  );

create policy "Users can delete their own cart items"
  on public.cart_items for delete
  using (
    exists (
      select 1 from public.carts
      where public.carts.id = public.cart_items.cart_id
      and public.carts.user_id = auth.uid()
    )
  );
