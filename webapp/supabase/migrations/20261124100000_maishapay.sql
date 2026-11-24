-- Paiements en ligne avec MaishaPay (mobile money et carte).
-- Un paiement = une tentative : si elle échoue, une nouvelle ligne « en_attente » est créée pour réessayer.

alter table public.payments
  add column if not exists reference       text,        -- notre référence unique, envoyée à MaishaPay (transactionReference)
  add column if not exists provider_tx_id  text,        -- numéro de la transaction chez MaishaPay (transactionId)
  add column if not exists fees            numeric(10, 2), -- frais annoncés par MaishaPay (cost.frais)
  add column if not exists failure_reason  text,        -- pourquoi le paiement a échoué (refus, délai dépassé…)
  add column if not exists payment_page    text,        -- carte : page de paiement sécurisée où envoyer le client
  add column if not exists started_at      timestamptz, -- demande envoyée au prestataire
  add column if not exists expires_at      timestamptz, -- au-delà, le paiement en attente est considéré comme échoué
  add column if not exists checked_at      timestamptz; -- dernière vérification auprès du prestataire

create unique index if not exists payments_reference_key on public.payments (reference) where reference is not null;
create index if not exists payments_provider_tx_idx on public.payments (provider_tx_id) where provider_tx_id is not null;
-- Paiements en ligne encore en attente (revérifiés toutes les minutes)
create index if not exists payments_pending_started_idx on public.payments (started_at)
  where status = 'en_attente' and kind = 'paiement' and started_at is not null;

-- Journal de chaque paiement : demande, réponse, notification reçue, vérification, expiration.
-- Sert en cas de litige et pour ne jamais traiter deux fois le même message.
-- Les clés MaishaPay ne sont JAMAIS enregistrées ici.
create table if not exists public.payment_events (
  id          uuid primary key default gen_random_uuid(),
  payment_id  uuid not null references public.payments (id) on delete cascade,
  source      text not null check (source in ('demande', 'reponse', 'notification', 'verification', 'expiration', 'erreur')),
  status      text,  -- statut lu dans le message (PENDING, SUCCESS, FAILED…)
  payload     jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists payment_events_payment_idx on public.payment_events (payment_id, created_at);

-- Accès réservé à l'API (connexion serveur) : aucune lecture ni écriture depuis le navigateur
alter table public.payment_events enable row level security;
