-- kclick · File d'envoi des e-mails (Resend)
-- Chaque e-mail est d'abord enregistré ici, puis envoyé en arrière-plan par l'API (nouvel essai en cas d'échec).
-- Une commande n'échoue jamais à cause d'un e-mail.

create table if not exists public.email_outbox (
  id               uuid primary key default gen_random_uuid(),
  kind             text not null,                -- order_confirmation, team_new_order, invitation…
  to_email         text not null,
  subject          text not null,
  html             text not null,
  text             text,
  order_id         uuid references public.orders (id) on delete set null,
  status           text not null default 'en_attente' check (status in ('en_attente', 'envoye', 'echec', 'ignore')),
  attempts         int not null default 0,
  last_error       text,
  provider_id      text,                         -- identifiant de l'e-mail chez Resend
  created_at       timestamptz not null default now(),
  sent_at          timestamptz,
  next_attempt_at  timestamptz not null default now()
);

create index if not exists email_outbox_pending_idx on public.email_outbox (status, next_attempt_at);
create index if not exists email_outbox_order_idx on public.email_outbox (order_id);

alter table public.email_outbox enable row level security;
create policy "e-mails : super-admin lecture" on public.email_outbox for select to authenticated using (public.is_admin());
