-- MenuFlex: restaurants, their menus and the team who manage them.
--
-- Additive only: every object is created if missing, nothing is dropped or
-- rewritten, so it is safe to run on a project that already has data.
--
-- Access model
--   * The public (anon and signed-in non-admins) can read published
--     restaurants, their categories and their visible dishes. Nothing else.
--   * MenuFlex admins, listed in public.admins, can read and write everything.
--   * public.admins itself is only written from the SQL editor or the
--     service role; nobody can make themselves an admin from the app.

-- ---------------------------------------------------------------------------
-- Admins
-- ---------------------------------------------------------------------------

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- an admin may see their own row (the app checks it to confirm the role)
drop policy if exists "admins read own row" on public.admins;
create policy "admins read own row" on public.admins
  for select to authenticated
  using (user_id = auth.uid());

-- True when the signed-in user is a MenuFlex admin. Security definer so the
-- policies below can consult public.admins without exposing it.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Restaurants
-- ---------------------------------------------------------------------------

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  -- the menu lives at /m/<slug>/
  slug text not null unique
    check (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$'),
  -- the QR code points at /r/<public_code>/, which never changes, so printed
  -- codes keep working if the slug is edited later
  public_code text not null unique
    default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  name text not null check (char_length(name) between 1 and 80),
  subtitle_en text not null default '' check (char_length(subtitle_en) <= 80),
  subtitle_tr text not null default '' check (char_length(subtitle_tr) <= 80),
  logo_path text,
  logo_width integer check (logo_width > 0),
  logo_height integer check (logo_height > 0),
  accent_color text not null default '#f6d9a5' check (accent_color ~ '^#[0-9a-fA-F]{6}$'),
  background_color text not null default '#0d0b09' check (background_color ~ '^#[0-9a-fA-F]{6}$'),
  phone text not null default '' check (char_length(phone) <= 40),
  whatsapp text not null default '' check (whatsapp ~ '^[0-9]{0,20}$'),
  email text not null default '' check (char_length(email) <= 120),
  address text not null default '' check (char_length(address) <= 200),
  instagram text not null default '' check (char_length(instagram) <= 60),
  currency text not null default 'TRY' check (currency in ('TRY', 'EUR', 'USD', 'GBP')),
  default_locale text not null default 'tr' check (default_locale in ('tr', 'en')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists restaurants_status_idx on public.restaurants (status);

-- ---------------------------------------------------------------------------
-- Categories and dishes
-- ---------------------------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name_en text not null check (char_length(name_en) between 1 and 40),
  name_tr text not null check (char_length(name_tr) between 1 and 40),
  icon text not null default 'starters'
    check (icon in ('starters', 'fish', 'meat', 'desserts', 'drinks')),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists categories_restaurant_idx on public.categories (restaurant_id, position);

create table if not exists public.dishes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  name_en text not null check (char_length(name_en) between 1 and 80),
  name_tr text not null check (char_length(name_tr) between 1 and 80),
  description_en text not null default '' check (char_length(description_en) <= 240),
  description_tr text not null default '' check (char_length(description_tr) <= 240),
  price numeric(10, 2) not null check (price >= 0),
  photo_path text,
  photo_width integer check (photo_width > 0),
  photo_height integer check (photo_height > 0),
  visible boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dishes_category_idx on public.dishes (category_id, position);
create index if not exists dishes_restaurant_idx on public.dishes (restaurant_id);

-- a dish always belongs to its category's restaurant
create or replace function public.menuflex_dish_restaurant()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select c.restaurant_id into new.restaurant_id from public.categories c where c.id = new.category_id;
  if new.restaurant_id is null then
    raise exception 'unknown category %', new.category_id;
  end if;
  return new;
end;
$$;

drop trigger if exists dishes_restaurant on public.dishes;
create trigger dishes_restaurant
  before insert or update of category_id on public.dishes
  for each row execute function public.menuflex_dish_restaurant();

-- ---------------------------------------------------------------------------
-- Housekeeping triggers
-- ---------------------------------------------------------------------------

create or replace function public.menuflex_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists restaurants_touch on public.restaurants;
create trigger restaurants_touch before update on public.restaurants
  for each row execute function public.menuflex_touch();
drop trigger if exists categories_touch on public.categories;
create trigger categories_touch before update on public.categories
  for each row execute function public.menuflex_touch();
drop trigger if exists dishes_touch on public.dishes;
create trigger dishes_touch before update on public.dishes
  for each row execute function public.menuflex_touch();

-- the QR code's address never changes; the first publication is remembered
create or replace function public.menuflex_restaurant_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.public_code := old.public_code;
  if new.status = 'published' and old.status <> 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists restaurants_guard on public.restaurants;
create trigger restaurants_guard before update on public.restaurants
  for each row execute function public.menuflex_restaurant_guard();

create or replace function public.menuflex_restaurant_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists restaurants_insert on public.restaurants;
create trigger restaurants_insert before insert on public.restaurants
  for each row execute function public.menuflex_restaurant_insert();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.restaurants enable row level security;
alter table public.categories enable row level security;
alter table public.dishes enable row level security;

-- reading: published menus for everyone, everything for admins
drop policy if exists "read published restaurants" on public.restaurants;
create policy "read published restaurants" on public.restaurants
  for select to anon, authenticated
  using (status = 'published' or public.is_admin());

drop policy if exists "read published categories" on public.categories;
create policy "read published categories" on public.categories
  for select to anon, authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.restaurants r where r.id = restaurant_id and r.status = 'published')
  );

drop policy if exists "read published dishes" on public.dishes;
create policy "read published dishes" on public.dishes
  for select to anon, authenticated
  using (
    public.is_admin()
    or (visible and exists (select 1 from public.restaurants r where r.id = restaurant_id and r.status = 'published'))
  );

-- writing: admins only
drop policy if exists "admins write restaurants" on public.restaurants;
create policy "admins write restaurants" on public.restaurants
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins write categories" on public.categories;
create policy "admins write categories" on public.categories
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins write dishes" on public.dishes;
create policy "admins write dishes" on public.dishes
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Reordering: swap an item with its neighbour, in one statement
-- ---------------------------------------------------------------------------

-- Numbers the item's siblings 0, 1, 2… in their current order, then swaps
-- the item with the one before (direction -1) or after (+1). Security
-- invoker: the caller's row level security applies, so only admins can move
-- anything.
create or replace function public.menuflex_move(kind text, item uuid, direction integer)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  parent uuid;
  here integer;
begin
  if not public.is_admin() then
    raise exception 'not allowed';
  end if;
  if direction not in (-1, 1) then
    raise exception 'direction must be -1 or 1';
  end if;

  if kind = 'category' then
    select restaurant_id into parent from public.categories where id = item;
    if parent is null then return; end if;
    with ordered as (
      select id, (row_number() over (order by position, created_at, id) - 1)::integer as n
      from public.categories where restaurant_id = parent
    )
    update public.categories c set position = o.n from ordered o where c.id = o.id;
    select position into here from public.categories where id = item;
    update public.categories
      set position = case when id = item then here + direction else here end
      where restaurant_id = parent and (id = item or position = here + direction);
  elsif kind = 'dish' then
    select category_id into parent from public.dishes where id = item;
    if parent is null then return; end if;
    with ordered as (
      select id, (row_number() over (order by position, created_at, id) - 1)::integer as n
      from public.dishes where category_id = parent
    )
    update public.dishes d set position = o.n from ordered o where d.id = o.id;
    select position into here from public.dishes where id = item;
    update public.dishes
      set position = case when id = item then here + direction else here end
      where category_id = parent and (id = item or position = here + direction);
  else
    raise exception 'unknown kind %', kind;
  end if;
end;
$$;

revoke all on function public.menuflex_move(text, uuid, integer) from public;
grant execute on function public.menuflex_move(text, uuid, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Images: dish photos and logos
-- ---------------------------------------------------------------------------

-- Public bucket so menus load photos straight from the CDN. Files are named
-- with random ids, and only admins can upload, replace or delete them.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-images', 'menu-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- the storage API also needs read access to replace or delete a file
drop policy if exists "admins read menu images" on storage.objects;
create policy "admins read menu images" on storage.objects
  for select to authenticated
  using (bucket_id = 'menu-images' and public.is_admin());

drop policy if exists "admins upload menu images" on storage.objects;
create policy "admins upload menu images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'menu-images' and public.is_admin());

drop policy if exists "admins update menu images" on storage.objects;
create policy "admins update menu images" on storage.objects
  for update to authenticated
  using (bucket_id = 'menu-images' and public.is_admin())
  with check (bucket_id = 'menu-images' and public.is_admin());

drop policy if exists "admins delete menu images" on storage.objects;
create policy "admins delete menu images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'menu-images' and public.is_admin());
