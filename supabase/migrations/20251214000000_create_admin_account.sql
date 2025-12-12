-- Migration to create admin account with unlimited generations
-- This script should be run manually in Supabase SQL Editor after creating the user via Supabase Auth

-- Step 1: Create the user in Supabase Auth Dashboard first
-- Go to Authentication > Users > Add User
-- Email: noe.amar@icloud.com
-- Password: Noeamar2209#
-- Auto Confirm User: Yes

-- Step 2: After user is created, run this SQL to set up admin profile
-- This function will be called after the user is created

-- Add 'admin' to subscription_plan enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'admin' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')) THEN
    ALTER TYPE public.subscription_plan ADD VALUE 'admin';
  END IF;
END $$;

-- Insert admin plan if it doesn't exist
INSERT INTO public.subscription_plans (name, plan_type, price_monthly, gemini_monthly_limit, pro_monthly_limit, monthly_generations_medium, monthly_generations_pro, features)
VALUES (
  'Administrateur',
  'admin',
  0,
  NULL, -- NULL = unlimited
  NULL, -- NULL = unlimited
  NULL, -- NULL = unlimited
  NULL, -- NULL = unlimited
  '{"description": "Générations illimitées pour l'administrateur"}'::jsonb
)
ON CONFLICT (plan_type) DO UPDATE
SET 
  gemini_monthly_limit = NULL,
  pro_monthly_limit = NULL,
  monthly_generations_medium = NULL,
  monthly_generations_pro = NULL,
  features = '{"description": "Générations illimitées pour l''administrateur"}'::jsonb;

-- Function to set user as admin (call this after user is created)
CREATE OR REPLACE FUNCTION public.set_user_as_admin(_user_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
BEGIN
  -- Get user ID from auth.users
  SELECT id INTO _user_id 
  FROM auth.users 
  WHERE email = _user_email;
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found. Please create the user in Supabase Auth Dashboard first.', _user_email;
  END IF;
  
  -- Create or update profile with admin plan
  INSERT INTO public.profiles (
    user_id,
    subscription_plan,
    credits,
    monthly_generations_medium,
    monthly_generations_pro,
    monthly_reset_date
  )
  VALUES (
    _user_id,
    'admin',
    999999, -- High credits
    0, -- Will be reset, but doesn't matter since limit is NULL
    0,
    CURRENT_DATE
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    subscription_plan = 'admin',
    credits = 999999,
    monthly_generations_medium = 0,
    monthly_generations_pro = 0,
    monthly_reset_date = CURRENT_DATE;
  
  -- Add admin role if user_roles table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RAISE NOTICE 'User % has been set as admin with unlimited generations', _user_email;
END;
$$;

-- Update check_generation_limit to handle admin plan (unlimited)
CREATE OR REPLACE FUNCTION public.check_generation_limit(
  _user_id UUID,
  _model_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile RECORD;
  _plan RECORD;
  _current_count INTEGER;
  _limit INTEGER;
  _reset_date DATE;
BEGIN
  SELECT * INTO _profile FROM public.profiles WHERE user_id = _user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'Profile not found');
  END IF;
  
  -- Admin plan: always allow (unlimited)
  IF _profile.subscription_plan = 'admin' THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'remaining', -1, -- -1 means unlimited
      'limit', NULL
    );
  END IF;
  
  SELECT * INTO _plan FROM public.subscription_plans WHERE plan_type = _profile.subscription_plan;
  
  -- Handle free plan: daily limits
  IF _profile.subscription_plan = 'free' THEN
    -- Reset daily counts if new day
    IF _profile.last_generation_date < CURRENT_DATE THEN
      UPDATE public.profiles 
      SET daily_generations_medium = 0,
          daily_generations_pro = 0,
          last_generation_date = CURRENT_DATE
      WHERE user_id = _user_id;
      _profile.daily_generations_medium := 0;
      _profile.daily_generations_pro := 0;
    END IF;
    
    -- Free plan limits
    IF _model_type LIKE '%gemini-3%' OR _model_type LIKE '%3-pro%' THEN
      -- Pro model: 0 for free plan
      _current_count := _profile.daily_generations_pro;
      _limit := 0;
    ELSE
      -- MiniaMaker 2: 3 per day
      _current_count := _profile.daily_generations_medium;
      _limit := 3;
    END IF;
  ELSE
    -- Paid plans: monthly limits
    -- Reset monthly counts if new month
    _reset_date := COALESCE(_profile.monthly_reset_date, DATE_TRUNC('month', CURRENT_DATE)::DATE);
    
    IF _reset_date < DATE_TRUNC('month', CURRENT_DATE)::DATE THEN
      UPDATE public.profiles 
      SET monthly_generations_medium = 0,
          monthly_generations_pro = 0,
          monthly_reset_date = DATE_TRUNC('month', CURRENT_DATE)::DATE
      WHERE user_id = _user_id;
      _profile.monthly_generations_medium := 0;
      _profile.monthly_generations_pro := 0;
      _profile.monthly_reset_date := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    END IF;
    
    -- Determine model type and get monthly limits
    IF _model_type LIKE '%gemini-3%' OR _model_type LIKE '%3-pro%' THEN
      -- Pro model
      _current_count := COALESCE(_profile.monthly_generations_pro, 0);
      _limit := _plan.pro_monthly_limit; -- NULL means unlimited
    ELSE
      -- MiniaMaker 2 (gemini-2.5-flash-image-preview)
      _current_count := COALESCE(_profile.monthly_generations_medium, 0);
      _limit := _plan.gemini_monthly_limit; -- NULL means unlimited
    END IF;
  END IF;
  
  -- Check if unlimited (NULL limit) or under limit
  IF _limit IS NULL OR _current_count < _limit THEN
    RETURN jsonb_build_object(
      'allowed', true, 
      'remaining', CASE WHEN _limit IS NULL THEN -1 ELSE _limit - _current_count - 1 END,
      'limit', _limit
    );
  ELSE
    RETURN jsonb_build_object(
      'allowed', false, 
      'remaining', 0,
      'limit', _limit,
      'error', CASE WHEN _profile.subscription_plan = 'free' THEN 'Daily limit reached' ELSE 'Monthly limit reached' END
    );
  END IF;
END;
$$;

-- Instructions comment:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" 
-- 3. Email: noe.amar@icloud.com
-- 4. Password: 
-- 5. Check "Auto Confirm User"
-- 6. Click "Create User"
-- 7. Then run: SELECT public.set_user_as_admin('noe.amar@icloud.com');

