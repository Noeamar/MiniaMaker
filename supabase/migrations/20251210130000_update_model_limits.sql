-- Add column for tracking cheap model (2.0) generations
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS daily_generations_cheap INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_generations_medium INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_generations_pro INTEGER DEFAULT 0;

-- Update subscription plans with new limits
-- Free plan: 5 cheap (2.0), 3 medium (2.5), 1 pro (3.0)
UPDATE public.subscription_plans 
SET nano_daily_limit = 5, 
    gemini_daily_limit = 3,
    features = '{"description": "5 générations 2.0/jour, 3 générations 2.5/jour, 1 génération 3.0/jour"}'::jsonb
WHERE plan_type = 'free';

-- Starter plan: 20 cheap, 10 medium, 3 pro
UPDATE public.subscription_plans 
SET nano_daily_limit = 20, 
    gemini_daily_limit = 10,
    features = '{"description": "20 générations 2.0/jour, 10 générations 2.5/jour, 3 générations 3.0/jour"}'::jsonb
WHERE plan_type = 'starter';

-- Pro plan: 50 cheap, 25 medium, 10 pro
UPDATE public.subscription_plans 
SET nano_daily_limit = 50, 
    gemini_daily_limit = 25,
    features = '{"description": "50 générations 2.0/jour, 25 générations 2.5/jour, 10 générations 3.0/jour"}'::jsonb
WHERE plan_type = 'pro';

-- Unlimited plan: unlimited for all
UPDATE public.subscription_plans 
SET nano_daily_limit = NULL, 
    gemini_daily_limit = NULL,
    features = '{"description": "Générations illimitées pour tous les modèles"}'::jsonb
WHERE plan_type = 'unlimited';

-- Update check_generation_limit function to handle 3 model types
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
BEGIN
  -- Get user profile
  SELECT * INTO _profile FROM public.profiles WHERE user_id = _user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'Profile not found');
  END IF;
  
  -- Reset daily counts if new day
  IF _profile.last_generation_date < CURRENT_DATE THEN
    UPDATE public.profiles 
    SET daily_generations_cheap = 0,
        daily_generations_medium = 0,
        daily_generations_pro = 0,
        daily_generations_nano = 0,
        daily_generations_gemini = 0,
        last_generation_date = CURRENT_DATE
    WHERE user_id = _user_id;
    _profile.daily_generations_cheap := 0;
    _profile.daily_generations_medium := 0;
    _profile.daily_generations_pro := 0;
  END IF;
  
  -- Get subscription plan limits
  SELECT * INTO _plan FROM public.subscription_plans WHERE plan_type = _profile.subscription_plan;
  
  -- Determine current count and limit based on model type
  -- Model 2.0 (cheap) uses nano_daily_limit
  -- Model 2.5 (medium) uses gemini_daily_limit  
  -- Model 3.0 (pro) uses a separate limit (we'll use gemini_daily_limit / 3 for now, or add a new column)
  IF _model_type LIKE '%gemini-3%' OR _model_type LIKE '%3-pro%' THEN
    -- Pro model (3.0) - for free plan: 1 per day, for others: use gemini_daily_limit / 3
    _current_count := _profile.daily_generations_pro;
    IF _profile.subscription_plan = 'free' THEN
      _limit := 1;
    ELSIF _plan.gemini_daily_limit IS NULL THEN
      _limit := NULL; -- Unlimited
    ELSE
      -- For paid plans, pro limit is roughly gemini_daily_limit / 3
      _limit := GREATEST(1, _plan.gemini_daily_limit / 3);
    END IF;
  ELSIF _model_type LIKE '%2.5%' OR _model_type LIKE '%flash-image-preview%' THEN
    -- Medium model (2.5) - uses gemini_daily_limit
    _current_count := _profile.daily_generations_medium;
    IF _profile.subscription_plan = 'free' THEN
      _limit := 3;
    ELSE
      _limit := _plan.gemini_daily_limit;
    END IF;
  ELSE
    -- Cheap model (2.0) - uses nano_daily_limit
    _current_count := _profile.daily_generations_cheap;
    IF _profile.subscription_plan = 'free' THEN
      _limit := 5;
    ELSE
      _limit := _plan.nano_daily_limit;
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
      'error', 'Daily limit reached'
    );
  END IF;
END;
$$;

-- Update increment_generation_count function to handle 3 model types
CREATE OR REPLACE FUNCTION public.increment_generation_count(
  _user_id UUID,
  _model_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _model_type LIKE '%gemini-3%' OR _model_type LIKE '%3-pro%' THEN
    -- Pro model (3.0)
    UPDATE public.profiles 
    SET daily_generations_pro = daily_generations_pro + 1,
        last_generation_date = CURRENT_DATE
    WHERE user_id = _user_id;
  ELSIF _model_type LIKE '%2.5%' OR _model_type LIKE '%flash-image-preview%' THEN
    -- Medium model (2.5)
    UPDATE public.profiles 
    SET daily_generations_medium = daily_generations_medium + 1,
        last_generation_date = CURRENT_DATE
    WHERE user_id = _user_id;
  ELSE
    -- Cheap model (2.0)
    UPDATE public.profiles 
    SET daily_generations_cheap = daily_generations_cheap + 1,
        last_generation_date = CURRENT_DATE
    WHERE user_id = _user_id;
  END IF;
END;
$$;

-- Update handle_new_user to initialize new columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    credits, 
    subscription_tier,
    subscription_plan,
    daily_generations_nano,
    daily_generations_gemini,
    daily_generations_cheap,
    daily_generations_medium,
    daily_generations_pro,
    last_generation_date
  )
  VALUES (
    NEW.id, 
    50, 
    'free',
    'free',
    0,
    0,
    0,
    0,
    0,
    CURRENT_DATE
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

