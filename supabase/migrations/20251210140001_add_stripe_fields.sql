-- Add Stripe-related columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id ON public.profiles(stripe_subscription_id);

-- Note: The enum values 'basic' and 'standard' need to be added separately
-- Run this SQL manually in Supabase SQL Editor:
-- ALTER TYPE public.subscription_plan ADD VALUE IF NOT EXISTS 'basic';
-- ALTER TYPE public.subscription_plan ADD VALUE IF NOT EXISTS 'standard';

-- Then update subscription plans (run this after adding enum values)
-- INSERT INTO public.subscription_plans (name, plan_type, price_monthly, nano_daily_limit, gemini_daily_limit, features) 
-- VALUES
--   ('Basic', 'basic', 15, 10, 1, '{"description": "10 MiniaMaker Lite/jour, 1 MiniaMaker 2/jour"}'::jsonb),
--   ('Standard', 'standard', 20, 100, 20, '{"description": "100 MiniaMaker Lite/jour, 20 MiniaMaker 2/jour"}'::jsonb),
--   ('Pro', 'pro', 29, 9999, 200, '{"description": "MiniaMaker Lite illimité, 200 MiniaMaker 2/jour"}'::jsonb)
-- ON CONFLICT (plan_type) DO UPDATE SET
--   name = EXCLUDED.name,
--   price_monthly = EXCLUDED.price_monthly,
--   nano_daily_limit = EXCLUDED.nano_daily_limit,
--   gemini_daily_limit = EXCLUDED.gemini_daily_limit,
--   features = EXCLUDED.features;

