-- kclick · Schéma de base (référence : schéma « La base de données », 21 tables en 6 domaines)
-- + ajouts validés : commande partielle (total d'origine / ajusté), notifications par brand,
--   point de retrait, heure de collecte par part, remboursements.

/* ---------- Types ---------- */
create type public.app_role       as enum ('client', 'employe', 'livreur', 'super_admin');
-- Statut global d'une commande. Onglets dashboard : voir public.order_tab()
create type public.order_status   as enum ('en_attente', 'en_cours', 'prete_retrait', 'en_livraison', 'livree', 'retiree', 'refusee', 'annulee');
-- Statut de la part d'une brand dans une commande
create type public.part_status    as enum ('en_attente', 'acceptee', 'en_preparation', 'prete', 'collectee', 'refusee', 'annulee');
create type public.delivery_mode  as enum ('livraison', 'retrait');
create type public.payment_method as enum ('mobile_money', 'carte', 'especes');
create type public.payment_status as enum ('en_attente', 'paye', 'echoue', 'rembourse', 'annule');
create type public.payment_kind   as enum ('paiement', 'remboursement');
create type public.notif_channel  as enum ('app', 'whatsapp', 'sms', 'email');
create type public.sale_unit      as enum ('piece', 'kg');

create sequence public.order_number_seq;

/* ---------- Comptes ---------- */
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  phone       text,
  lang        text not null default 'fr' check (lang in ('fr', 'en')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

/* ---------- Catalogue ---------- */
create table public.brands (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  color            text,
  logo_url         text,
  is_open          boolean not null default true,
  -- Point de retrait : les parts des autres brands y sont regroupées pour le client
  is_pickup_point  boolean not null default false,
  pickup_address   text,
  created_at       timestamptz not null default now()
);

create table public.user_roles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role        public.app_role not null,
  brand_id    uuid references public.brands (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique nulls not distinct (user_id, role, brand_id),
  constraint employe_has_brand check (role <> 'employe' or brand_id is not null)
);

create table public.brand_hours (
  id             uuid primary key default gen_random_uuid(),
  brand_id       uuid not null references public.brands (id) on delete cascade,
  weekday        smallint not null check (weekday between 0 and 6), -- 0 = dimanche
  opens_at       time,
  closes_at      time,
  last_order_at  time, -- heure limite pour la livraison du jour
  unique (brand_id, weekday)
);

create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  brand_id   uuid not null references public.brands (id) on delete cascade,
  parent_id  uuid references public.categories (id) on delete set null,
  slug       text not null,
  name_fr    text not null,
  name_en    text,
  position   int not null default 0,
  unique (brand_id, slug)
);

create table public.products (
  id              uuid primary key default gen_random_uuid(),
  brand_id        uuid not null references public.brands (id) on delete restrict,
  category_id     uuid references public.categories (id) on delete set null,
  slug            text not null unique, -- = id utilisé par le front (#produit/<slug>)
  name_fr         text not null,
  name_en         text,
  description_fr  text,
  description_en  text,
  base_price      numeric(10, 2) check (base_price >= 0), -- prix « à partir de », null = à venir
  tag             text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Ce qui se vend vraiment : prix, stock (un seul stock par variante) et référence eshopaid
create table public.product_variants (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products (id) on delete cascade,
  label         text not null,
  sku_eshopaid  text unique,
  price         numeric(10, 2) check (price >= 0), -- null = prix à venir (non commandable)
  unit          public.sale_unit not null default 'piece',
  stock         int not null default 0 check (stock >= 0),
  is_default    boolean not null default false,
  is_active     boolean not null default true,
  position      int not null default 0
);

create table public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  variant_id  uuid references public.product_variants (id) on delete set null,
  url         text not null,
  alt         text,
  position    int not null default 0
);

/* ---------- Livraison (livreurs) ---------- */
create table public.riders (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null unique references public.profiles (id) on delete cascade,
  vehicle        text,
  zone           text,
  is_available   boolean not null default false,
  last_position  point, -- vide jusqu'à l'application native
  created_at     timestamptz not null default now()
);

/* ---------- Espace client ---------- */
create table public.addresses (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  label       text,
  commune     text not null,
  quartier    text,
  street      text,
  landmark    text,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

create table public.cart_items (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  variant_id    uuid not null references public.product_variants (id) on delete cascade,
  quantity      int not null check (quantity > 0),
  gift_message  text check (char_length(gift_message) <= 120),
  unique (profile_id, variant_id)
);

create table public.favorites (
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (profile_id, product_id)
);

/* ---------- Commandes ---------- */
create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  number            text not null unique default ('KC-' || lpad(nextval('public.order_number_seq')::text, 5, '0')),
  customer_id       uuid references public.profiles (id) on delete set null, -- null = commande sans compte
  customer_name     text not null,
  customer_phone    text not null,
  customer_email    text,
  mode              public.delivery_mode not null,
  address_snapshot  jsonb, -- copie de l'adresse au moment de la commande
  pickup_brand_id   uuid references public.brands (id), -- point de retrait (mode retrait)
  status            public.order_status not null default 'en_attente',
  payment_method    public.payment_method not null,
  subtotal          numeric(10, 2) not null default 0,
  delivery_fee      numeric(10, 2) not null default 0,
  total             numeric(10, 2) not null default 0, -- total d'origine
  adjusted_total    numeric(10, 2) not null default 0, -- total après parts refusées / annulées
  is_partial        boolean not null default false,    -- au moins une part refusée, la commande continue
  customer_note     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint delivery_needs_address check (mode = 'retrait' or address_snapshot is not null)
);

-- La part de chaque brand dans une commande
create table public.order_parts (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  brand_id        uuid not null references public.brands (id),
  status          public.part_status not null default 'en_attente',
  amount_due      numeric(10, 2) not null default 0,
  refusal_reason  text,
  accepted_at     timestamptz,
  ready_at        timestamptz,
  collected_at    timestamptz, -- collectée par le livreur / transférée au point de retrait
  refused_at      timestamptz,
  updated_at      timestamptz not null default now(),
  unique (order_id, brand_id),
  constraint refusal_needs_reason check (status <> 'refusee' or refusal_reason is not null)
);

create table public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_part_id  uuid not null references public.order_parts (id) on delete cascade,
  variant_id     uuid references public.product_variants (id) on delete set null,
  product_name   text not null,
  variant_label  text,
  unit_price     numeric(10, 2) not null,
  quantity       int not null check (quantity > 0),
  line_total     numeric(10, 2) generated always as (unit_price * quantity) stored,
  gift_message   text check (char_length(gift_message) <= 120)
);

create table public.order_status_history (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders (id) on delete cascade,
  order_part_id  uuid references public.order_parts (id) on delete cascade,
  from_status    text,
  to_status      text not null,
  changed_by     uuid references public.profiles (id) on delete set null,
  reason         text,
  created_at     timestamptz not null default now()
);

create table public.payments (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders (id) on delete cascade,
  order_part_id  uuid references public.order_parts (id) on delete set null, -- part concernée par un remboursement
  kind           public.payment_kind not null default 'paiement',
  method         public.payment_method not null,
  provider       text, -- M-Pesa, Orange Money, Airtel Money, Visa…
  amount         numeric(10, 2) not null check (amount > 0),
  currency       text not null default 'USD' check (currency in ('USD', 'CDF')),
  status         public.payment_status not null default 'en_attente',
  provider_ref   text,
  payer_phone    text,
  collected_by   uuid references public.profiles (id) on delete set null,
  paid_at        timestamptz,
  created_at     timestamptz not null default now()
);

/* ---------- Livraison (courses, cash) ---------- */
create table public.deliveries (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null unique references public.orders (id) on delete cascade,
  rider_id        uuid not null references public.riders (id),
  assigned_by     uuid references public.profiles (id) on delete set null,
  eta_minutes     int,
  assigned_at     timestamptz not null default now(),
  picked_up_at    timestamptz,
  delivered_at    timestamptz,
  cash_collected  numeric(10, 2),
  note            text
);

create table public.cash_handovers (
  id            uuid primary key default gen_random_uuid(),
  rider_id      uuid not null references public.riders (id),
  brand_id      uuid not null references public.brands (id),
  day           date not null,
  amount_due    numeric(10, 2) not null default 0,
  amount_given  numeric(10, 2),
  confirmed_by  uuid references public.profiles (id) on delete set null,
  confirmed_at  timestamptz,
  unique (rider_id, brand_id, day)
);

/* ---------- Système ---------- */
create table public.notifications (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid references public.profiles (id) on delete cascade, -- une personne
  brand_id         uuid references public.brands (id) on delete cascade,   -- tous les employés d'une brand
  recipient_phone  text,                                                   -- client sans compte (WhatsApp / SMS)
  order_id         uuid references public.orders (id) on delete cascade,
  channel          public.notif_channel not null default 'app',
  title            text not null,
  body             text,
  read_at          timestamptz,
  created_at       timestamptz not null default now(),
  constraint has_recipient check (profile_id is not null or brand_id is not null or recipient_phone is not null)
);

/* ---------- Index sur les liens ---------- */
create index on public.user_roles (user_id);
create index on public.user_roles (brand_id);
create index on public.categories (brand_id);
create index on public.products (brand_id);
create index on public.products (category_id);
create index on public.product_variants (product_id);
create index on public.product_images (product_id);
create index on public.addresses (profile_id);
create index on public.orders (customer_id);
create index on public.orders (status);
create index on public.orders (created_at desc);
create index on public.order_parts (order_id);
create index on public.order_parts (brand_id, status);
create index on public.order_items (order_part_id);
create index on public.order_status_history (order_id);
create index on public.payments (order_id);
create index on public.deliveries (rider_id);
create index on public.notifications (profile_id);
create index on public.notifications (brand_id);
create index on public.notifications (order_id);
