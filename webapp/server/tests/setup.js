// Variables minimales pour les tests (aucune connexion réelle n'est ouverte par ces tests)
process.env.NODE_ENV = 'test'
process.env.LOG_LEVEL = 'silent'
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test'
process.env.SUPABASE_URL ??= 'https://example.supabase.co'
