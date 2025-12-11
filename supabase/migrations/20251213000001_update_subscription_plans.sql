-- Update subscription plans with new pricing and monthly limits
-- BASIC: 4.99€/mois - 30 MiniaMaker2/mois, 3 Pro/mois
-- PLUS: 12.99€/mois - 100 MiniaMaker2/mois, 10 Pro/mois
-- PRO: 29.99€/mois - 400 MiniaMaker2/mois, 30 Pro/mois
-- 
-- NOTE: Run 20251213000000_add_plus_enum.sql FIRST to add 'plus' to the enum

-- Remove 'standard' from plans if it exists and update to 'plus'
-- First, update any existing 'standard' plans to 'plus' (if enum value exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'plus' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')) THEN
    UPDATE public.subscription_plans 
    SET plan_type = 'plus' 
    WHERE plan_type = 'standard';
  END IF;
END $$;

-- Update or insert BASIC plan
INSERT INTO public.subscription_plans (name, plan_type, price_monthly, gemini_monthly_limit, pro_monthly_limit, features) 
VALUES (
  'BASIC',
  'basic',
  4.99,
  30,  -- 30 MiniaMaker 2 / mois
  3,   -- 3 Pro / mois
  '{"description": "30 générations MiniaMaker 2/mois, 3 générations Pro/mois"}'::jsonb
)
ON CONFLICT (plan_type) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  gemini_monthly_limit = EXCLUDED.gemini_monthly_limit,
  pro_monthly_limit = EXCLUDED.pro_monthly_limit,
  features = EXCLUDED.features;

-- Update or insert PLUS plan
INSERT INTO public.subscription_plans (name, plan_type, price_monthly, gemini_monthly_limit, pro_monthly_limit, features) 
VALUES (
  'PLUS',
  'plus',
  12.99,
  100,  -- 100 MiniaMaker 2 / mois
  10,   -- 10 Pro / mois
  '{"description": "100 générations MiniaMaker 2/mois, 10 générations Pro/mois"}'::jsonb
)
ON CONFLICT (plan_type) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  gemini_monthly_limit = EXCLUDED.gemini_monthly_limit,
  pro_monthly_limit = EXCLUDED.pro_monthly_limit,
  features = EXCLUDED.features;

-- Update or insert PRO plan
INSERT INTO public.subscription_plans (name, plan_type, price_monthly, gemini_monthly_limit, pro_monthly_limit, features) 
VALUES (
  'PRO',
  'pro',
  29.99,
  400,  -- 400 MiniaMaker 2 / mois
  30,   -- 30 Pro / mois
  '{"description": "400 générations MiniaMaker 2/mois, 30 générations Pro/mois"}'::jsonb
)
ON CONFLICT (plan_type) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  gemini_monthly_limit = EXCLUDED.gemini_monthly_limit,
  pro_monthly_limit = EXCLUDED.pro_monthly_limit,
  features = EXCLUDED.features;

-- Add monthly limit columns if they don't exist
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS gemini_monthly_limit INTEGER,
ADD COLUMN IF NOT EXISTS pro_monthly_limit INTEGER;

-- Add monthly usage tracking columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS monthly_generations_medium INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_generations_pro INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_reset_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE);

-- Create index for monthly reset date
CREATE INDEX IF NOT EXISTS idx_profiles_monthly_reset_date ON public.profiles(monthly_reset_date);

