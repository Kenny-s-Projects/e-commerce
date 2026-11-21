-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  phone text,
  lang text NOT NULL DEFAULT 'fr'::text CHECK (lang = ANY (ARRAY['fr'::text, 'en'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  email text,
  last_seen_at timestamp with time zone,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.brands (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  color text,
  logo_url text,
  is_open boolean NOT NULL DEFAULT true,
  is_pickup_point boolean NOT NULL DEFAULT false,
  pickup_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT brands_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role USER-DEFINED NOT NULL,
  brand_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_roles_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id)
);
CREATE TABLE public.brand_hours (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL,
  weekday smallint NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  opens_at time without time zone,
  closes_at time without time zone,
  last_order_at time without time zone,
  CONSTRAINT brand_hours_pkey PRIMARY KEY (id),
  CONSTRAINT brand_hours_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL,
  parent_id uuid,
  slug text NOT NULL,
  name_fr text NOT NULL,
  name_en text,
  position integer NOT NULL DEFAULT 0,
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id),
  CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL,
  category_id uuid,
  slug text NOT NULL UNIQUE,
  name_fr text NOT NULL,
  name_en text,
  description_fr text,
  description_en text,
  base_price numeric CHECK (base_price >= 0::numeric),
  tag text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  ref text UNIQUE,
  erp_name text,
  unit USER-DEFINED NOT NULL DEFAULT 'piece'::sale_unit,
  stock_kg numeric CHECK (stock_kg >= 0::numeric),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.product_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  label text NOT NULL,
  sku_eshopaid text UNIQUE,
  price numeric CHECK (price >= 0::numeric),
  unit USER-DEFINED NOT NULL DEFAULT 'piece'::sale_unit,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  weight_grams integer CHECK (weight_grams > 0),
  CONSTRAINT product_variants_pkey PRIMARY KEY (id),
  CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.product_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  variant_id uuid,
  url text NOT NULL,
  alt text,
  position integer NOT NULL DEFAULT 0,
  CONSTRAINT product_images_pkey PRIMARY KEY (id),
  CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT product_images_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id)
);
CREATE TABLE public.riders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE,
  vehicle text,
  zone text,
  is_available boolean NOT NULL DEFAULT false,
  last_position point,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT riders_pkey PRIMARY KEY (id),
  CONSTRAINT riders_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  label text,
  commune text NOT NULL,
  quartier text,
  street text,
  landmark text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT addresses_pkey PRIMARY KEY (id),
  CONSTRAINT addresses_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.cart_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  variant_id uuid NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  gift_message text CHECK (char_length(gift_message) <= 120),
  CONSTRAINT cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_items_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT cart_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id)
);
CREATE TABLE public.favorites (
  profile_id uuid NOT NULL,
  product_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT favorites_pkey PRIMARY KEY (profile_id, product_id),
  CONSTRAINT favorites_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT favorites_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  number text NOT NULL DEFAULT ('KC-'::text || lpad((nextval('order_number_seq'::regclass))::text, 5, '0'::text)) UNIQUE,
  customer_id uuid,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  mode USER-DEFINED NOT NULL,
  address_snapshot jsonb,
  pickup_brand_id uuid,
  status USER-DEFINED NOT NULL DEFAULT 'en_attente'::order_status,
  payment_method USER-DEFINED NOT NULL,
  subtotal numeric NOT NULL DEFAULT 0,
  delivery_fee numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  adjusted_total numeric NOT NULL DEFAULT 0,
  is_partial boolean NOT NULL DEFAULT false,
  customer_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id),
  CONSTRAINT orders_pickup_brand_id_fkey FOREIGN KEY (pickup_brand_id) REFERENCES public.brands(id)
);
CREATE TABLE public.order_parts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'en_attente'::part_status,
  amount_due numeric NOT NULL DEFAULT 0,
  refusal_reason text,
  accepted_at timestamp with time zone,
  ready_at timestamp with time zone,
  collected_at timestamp with time zone,
  refused_at timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_parts_pkey PRIMARY KEY (id),
  CONSTRAINT order_parts_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_parts_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_part_id uuid NOT NULL,
  variant_id uuid,
  product_name text NOT NULL,
  variant_label text,
  unit_price numeric NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  line_total numeric DEFAULT (unit_price * (quantity)::numeric),
  gift_message text CHECK (char_length(gift_message) <= 120),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_part_id_fkey FOREIGN KEY (order_part_id) REFERENCES public.order_parts(id),
  CONSTRAINT order_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id)
);
CREATE TABLE public.order_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  order_part_id uuid,
  from_status text,
  to_status text NOT NULL,
  changed_by uuid,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_status_history_pkey PRIMARY KEY (id),
  CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_status_history_order_part_id_fkey FOREIGN KEY (order_part_id) REFERENCES public.order_parts(id),
  CONSTRAINT order_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  order_part_id uuid,
  kind USER-DEFINED NOT NULL DEFAULT 'paiement'::payment_kind,
  method USER-DEFINED NOT NULL,
  provider text,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  currency text NOT NULL DEFAULT 'USD'::text CHECK (currency = ANY (ARRAY['USD'::text, 'CDF'::text])),
  status USER-DEFINED NOT NULL DEFAULT 'en_attente'::payment_status,
  provider_ref text,
  payer_phone text,
  collected_by uuid,
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT payments_order_part_id_fkey FOREIGN KEY (order_part_id) REFERENCES public.order_parts(id),
  CONSTRAINT payments_collected_by_fkey FOREIGN KEY (collected_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.deliveries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE,
  rider_id uuid NOT NULL,
  assigned_by uuid,
  eta_minutes integer,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  picked_up_at timestamp with time zone,
  delivered_at timestamp with time zone,
  cash_collected numeric,
  note text,
  CONSTRAINT deliveries_pkey PRIMARY KEY (id),
  CONSTRAINT deliveries_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT deliveries_rider_id_fkey FOREIGN KEY (rider_id) REFERENCES public.riders(id),
  CONSTRAINT deliveries_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.cash_handovers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rider_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  day date NOT NULL,
  amount_due numeric NOT NULL DEFAULT 0,
  amount_given numeric,
  confirmed_by uuid,
  confirmed_at timestamp with time zone,
  CONSTRAINT cash_handovers_pkey PRIMARY KEY (id),
  CONSTRAINT cash_handovers_rider_id_fkey FOREIGN KEY (rider_id) REFERENCES public.riders(id),
  CONSTRAINT cash_handovers_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id),
  CONSTRAINT cash_handovers_confirmed_by_fkey FOREIGN KEY (confirmed_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid,
  brand_id uuid,
  recipient_phone text,
  order_id uuid,
  channel USER-DEFINED NOT NULL DEFAULT 'app'::notif_channel,
  title text NOT NULL,
  body text,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT notifications_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id),
  CONSTRAINT notifications_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.staff_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  first_name text,
  last_name text,
  phone text,
  role USER-DEFINED NOT NULL CHECK (role <> 'client'::app_role),
  brand_id uuid,
  vehicle text,
  zone text,
  invited_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  accepted_at timestamp with time zone,
  revoked_at timestamp with time zone,
  CONSTRAINT staff_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT staff_invitations_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id),
  CONSTRAINT staff_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.app_settings (
  key text NOT NULL CHECK (key = ANY (ARRAY['general'::text, 'delivery'::text, 'payments'::text, 'notifications'::text, 'security'::text])),
  value jsonb NOT NULL,
  updated_by uuid,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT app_settings_pkey PRIMARY KEY (key),
  CONSTRAINT app_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.email_outbox (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  to_email text NOT NULL,
  subject text NOT NULL,
  html text NOT NULL,
  text text,
  order_id uuid,
  status text NOT NULL DEFAULT 'en_attente'::text CHECK (status = ANY (ARRAY['en_attente'::text, 'envoye'::text, 'echec'::text, 'ignore'::text])),
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  provider_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  sent_at timestamp with time zone,
  next_attempt_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT email_outbox_pkey PRIMARY KEY (id),
  CONSTRAINT email_outbox_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);