
-- Create subscription plans enum
CREATE TYPE public.subscription_plan AS ENUM ('free', 'starter', 'pro', 'unlimited');

-- Create conversations table for ChatGPT-like interface
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Nouvelle conversation',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversation messages table
CREATE TABLE public.conversation_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  image_urls TEXT[] DEFAULT '{}',
  model_used TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add daily usage tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS daily_generations_nano INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_generations_gemini INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_generation_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS subscription_plan subscription_plan DEFAULT 'free';

-- Create subscription plans table for billing
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  plan_type subscription_plan NOT NULL UNIQUE,
  price_monthly DECIMAL(10,2) NOT NULL,
  nano_daily_limit INTEGER, -- NULL means unlimited
  gemini_daily_limit INTEGER, -- NULL means unlimited
  features JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, plan_type, price_monthly, nano_daily_limit, gemini_daily_limit, features) VALUES
('Gratuit', 'free', 0, 3, 1, '{"description": "3 générations Nano/jour, 1 Gemini/jour"}'),
('Starter', 'starter', 15, 20, 5, '{"description": "20 générations Nano/jour, 5 Gemini/jour"}'),
('Pro', 'pro', 20, 50, 15, '{"description": "50 générations Nano/jour, 15 Gemini/jour"}'),
('Illimité', 'unlimited', 49, NULL, NULL, '{"description": "Générations illimitées"}');

-- Enable RLS on new tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "Users can view their own conversations" 
ON public.conversations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" 
ON public.conversations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" 
ON public.conversations FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" 
ON public.conversations FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for conversation messages
CREATE POLICY "Users can view messages in their conversations" 
ON public.conversation_messages FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.conversations 
  WHERE id = conversation_id AND user_id = auth.uid()
));

CREATE POLICY "Users can create messages in their conversations" 
ON public.conversation_messages FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.conversations 
  WHERE id = conversation_id AND user_id = auth.uid()
));

CREATE POLICY "Users can delete messages in their conversations" 
ON public.conversation_messages FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.conversations 
  WHERE id = conversation_id AND user_id = auth.uid()
));

-- RLS policy for subscription plans (public read)
CREATE POLICY "Anyone can view subscription plans" 
ON public.subscription_plans FOR SELECT 
USING (true);

-- Trigger for conversations updated_at
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check and reset daily limits
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
    SET daily_generations_nano = 0, 
        daily_generations_gemini = 0,
        last_generation_date = CURRENT_DATE
    WHERE user_id = _user_id;
    _profile.daily_generations_nano := 0;
    _profile.daily_generations_gemini := 0;
  END IF;
  
  -- Get subscription plan limits
  SELECT * INTO _plan FROM public.subscription_plans WHERE plan_type = _profile.subscription_plan;
  
  -- Determine current count and limit based on model type
  IF _model_type LIKE '%gemini-3%' THEN
    _current_count := _profile.daily_generations_gemini;
    _limit := _plan.gemini_daily_limit;
  ELSE
    _current_count := _profile.daily_generations_nano;
    _limit := _plan.nano_daily_limit;
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

-- Function to increment generation count
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
  IF _model_type LIKE '%gemini-3%' THEN
    UPDATE public.profiles 
    SET daily_generations_gemini = daily_generations_gemini + 1,
        last_generation_date = CURRENT_DATE
    WHERE user_id = _user_id;
  ELSE
    UPDATE public.profiles 
    SET daily_generations_nano = daily_generations_nano + 1,
        last_generation_date = CURRENT_DATE
    WHERE user_id = _user_id;
  END IF;
END;
$$;
