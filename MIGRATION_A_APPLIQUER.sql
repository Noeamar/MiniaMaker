-- Migration pour corriger les limites du plan free
-- Normal (MiniaMaker 2) = 3 générations/jour max, Pro = 0 (pas d'accès)

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
  
  SELECT * INTO _plan FROM public.subscription_plans WHERE plan_type = _profile.subscription_plan;
  
  -- Determine current count and limit based on model type
  IF _model_type LIKE '%gemini-3%' OR _model_type LIKE '%3-pro%' THEN
    -- Pro model (3.0) - for free plan: 0 per day (no access)
    _current_count := _profile.daily_generations_pro;
    IF _profile.subscription_plan = 'free' THEN
      _limit := 0; -- No access for free plan
    ELSIF _plan.gemini_daily_limit IS NULL THEN
      _limit := NULL; -- Unlimited
    ELSE
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
    -- Default to Medium model (2.5) - uses gemini_daily_limit
    _current_count := _profile.daily_generations_medium;
    IF _profile.subscription_plan = 'free' THEN
      _limit := 3; -- Free plan: 3 generations per day
    ELSE
      _limit := _plan.gemini_daily_limit;
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
      'error', CASE WHEN _limit = 0 THEN 'Accès non disponible pour le plan gratuit' ELSE 'Daily limit reached' END
    );
  END IF;
END;
$$;
