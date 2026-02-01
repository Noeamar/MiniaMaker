-- Update check_generation_limit function to handle monthly limits for paid plans
-- Free plan still uses daily limits (3 MiniaMaker 2/day, 0 Pro/day)
-- Paid plans (basic, plus, pro) use monthly limits

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
    -- Initialize monthly_reset_date if null
    IF _profile.monthly_reset_date IS NULL THEN
      UPDATE public.profiles 
      SET monthly_reset_date = DATE_TRUNC('month', CURRENT_DATE)
      WHERE user_id = _user_id;
      _profile.monthly_reset_date := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    END IF;
    
    -- Reset monthly counts if new month
    _reset_date := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    IF _profile.monthly_reset_date < _reset_date THEN
      UPDATE public.profiles 
      SET monthly_generations_medium = 0,
          monthly_generations_pro = 0,
          monthly_reset_date = _reset_date
      WHERE user_id = _user_id;
      _profile.monthly_generations_medium := 0;
      _profile.monthly_generations_pro := 0;
      _profile.monthly_reset_date := _reset_date;
    END IF;
    
    -- Get limits from plan
    IF _model_type LIKE '%gemini-3%' OR _model_type LIKE '%3-pro%' THEN
      -- Pro model
      _current_count := COALESCE(_profile.monthly_generations_pro, 0);
      _limit := COALESCE(_plan.pro_monthly_limit, 0);
    ELSE
      -- MiniaMaker 2
      _current_count := COALESCE(_profile.monthly_generations_medium, 0);
      _limit := COALESCE(_plan.gemini_monthly_limit, 0);
    END IF;
  END IF;
  
  -- Check if unlimited (NULL limit) or under limit
  IF _limit IS NULL OR (_limit > 0 AND _current_count < _limit) THEN
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
      'error', CASE WHEN _limit = 0 THEN 'Accès non disponible pour le plan gratuit' ELSE 'Limite mensuelle atteinte' END
    );
  END IF;
END;
$$;

-- Update increment_generation_count function to handle monthly counts
CREATE OR REPLACE FUNCTION public.increment_generation_count(
  _user_id UUID,
  _model_type TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile RECORD;
  _reset_date DATE;
BEGIN
  SELECT * INTO _profile FROM public.profiles WHERE user_id = _user_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Handle free plan: daily counts
  IF _profile.subscription_plan = 'free' THEN
    IF _model_type LIKE '%gemini-3%' OR _model_type LIKE '%3-pro%' THEN
      UPDATE public.profiles 
      SET daily_generations_pro = COALESCE(daily_generations_pro, 0) + 1
      WHERE user_id = _user_id;
    ELSE
      UPDATE public.profiles 
      SET daily_generations_medium = COALESCE(daily_generations_medium, 0) + 1
      WHERE user_id = _user_id;
    END IF;
  ELSE
    -- Paid plans: monthly counts
    -- Initialize monthly_reset_date if null
    IF _profile.monthly_reset_date IS NULL THEN
      UPDATE public.profiles 
      SET monthly_reset_date = DATE_TRUNC('month', CURRENT_DATE)
      WHERE user_id = _user_id;
    END IF;
    
    -- Reset if new month
    _reset_date := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    IF _profile.monthly_reset_date < _reset_date THEN
      UPDATE public.profiles 
      SET monthly_generations_medium = 0,
          monthly_generations_pro = 0,
          monthly_reset_date = _reset_date
      WHERE user_id = _user_id;
    END IF;
    
    -- Increment monthly count
    IF _model_type LIKE '%gemini-3%' OR _model_type LIKE '%3-pro%' THEN
      UPDATE public.profiles 
      SET monthly_generations_pro = COALESCE(monthly_generations_pro, 0) + 1
      WHERE user_id = _user_id;
    ELSE
      UPDATE public.profiles 
      SET monthly_generations_medium = COALESCE(monthly_generations_medium, 0) + 1
      WHERE user_id = _user_id;
    END IF;
  END IF;
END;
$$;




