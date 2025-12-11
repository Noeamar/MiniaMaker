-- Update handle_new_user function to use subscription_plan and initialize daily counters
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
    last_generation_date
  )
  VALUES (
    NEW.id, 
    50, 
    'free',
    'free',
    0,
    0,
    CURRENT_DATE
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

