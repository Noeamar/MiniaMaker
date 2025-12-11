# Instructions pour corriger les erreurs

## 1. Appliquer la migration pour ajouter 'basic' et 'standard' à l'enum

Exécutez cette migration dans Supabase SQL Editor :

```sql
-- Add 'basic' and 'standard' to subscription_plan enum
DO $$ 
BEGIN
  -- Add 'basic' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'basic' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
  ) THEN
    ALTER TYPE public.subscription_plan ADD VALUE 'basic';
  END IF;
  
  -- Add 'standard' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'standard' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
  ) THEN
    ALTER TYPE public.subscription_plan ADD VALUE 'standard';
  END IF;
END $$;

-- Insert or update subscription plans
INSERT INTO public.subscription_plans (name, plan_type, price_monthly, nano_daily_limit, gemini_daily_limit, features) 
VALUES
  ('Basic', 'basic', 15, 10, 5, '{"description": "10 MiniaMaker Lite/jour, 5 MiniaMaker 2/jour, 1 MiniaMaker Pro/jour"}'::jsonb),
  ('Standard', 'standard', 25, 50, 20, '{"description": "50 MiniaMaker Lite/jour, 20 MiniaMaker 2/jour, 5 MiniaMaker Pro/jour"}'::jsonb),
  ('Pro', 'pro', 39, 200, 100, '{"description": "200 MiniaMaker Lite/jour, 100 MiniaMaker 2/jour, 20 MiniaMaker Pro/jour"}'::jsonb)
ON CONFLICT (plan_type) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  nano_daily_limit = EXCLUDED.nano_daily_limit,
  gemini_daily_limit = EXCLUDED.gemini_daily_limit,
  features = EXCLUDED.features;
```

## 2. Vérifier la clé API Google

Assurez-vous que `GOOGLE_API_KEY` est configurée dans Supabase :
- Allez dans Project Settings > Edge Functions > Secrets
- Ajoutez `GOOGLE_API_KEY` avec votre clé API Google

## 3. Vérifier les logs de l'Edge Function

Si l'erreur 500 persiste, vérifiez les logs dans Supabase Dashboard > Edge Functions > generate-thumbnail > Logs
