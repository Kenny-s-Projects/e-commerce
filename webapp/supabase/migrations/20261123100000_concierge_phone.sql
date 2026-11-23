-- Nouveau numéro du concierge (WhatsApp et téléphone) : 0817723066 → +243 817 723 066
update public.app_settings
set value = jsonb_set(value, '{whatsapp}', '"+243817723066"'),
    updated_at = now()
where key = 'general';
