-- kclick · Paramètres de la plateforme (écran Paramètres du super admin)
-- Une ligne par rubrique : general, delivery, payments, notifications, security.
-- Les Maisons (ouverture, horaires, point de retrait) restent dans brands / brand_hours.

create table if not exists public.app_settings (
  key         text primary key check (key in ('general', 'delivery', 'payments', 'notifications', 'security')),
  value       jsonb not null,
  updated_by  uuid references public.profiles (id) on delete set null,
  updated_at  timestamptz not null default now()
);

alter table public.app_settings enable row level security;
create policy "paramètres : super-admin lecture" on public.app_settings for select to authenticated using (public.is_admin());
create policy "paramètres : super-admin modification" on public.app_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

insert into public.app_settings (key, value) values
  ('general', '{
     "platform": "kclick",
     "company": "Kenny’s International",
     "supportEmail": "ecommerce@kennysinternational.com",
     "whatsapp": "+243856486993",
     "address": "124 Boulevard du 30 Juin, Gombe",
     "defaultLang": "fr",
     "currency": "USD"
   }'),
  ('delivery', '{
     "zones": [{ "commune": "Gombe", "fee": 4, "delay": "Le jour même", "active": true }],
     "sameDayCutoff": "17:00",
     "cancelWindowMinutes": 15
   }'),
  ('payments', '{
     "mobileMoney": { "enabled": true, "operators": { "mpesa": true, "orange": true, "airtel": true } },
     "card": { "enabled": true },
     "cashOnDelivery": false,
     "provider": null
   }'),
  ('notifications', '{
     "customerEmails": { "confirmation": true, "ready": true, "onTheWay": true, "delivered": true },
     "teamRecipients": ["ecommerce@kennysinternational.com"],
     "newOrderSound": true
   }'),
  ('security', '{
     "codeValidityMinutes": 10,
     "idleLogoutMinutes": 60
   }')
on conflict (key) do nothing;
