-- Script SQL pour corriger manuellement un abonnement utilisateur
-- Remplacez 'VOTRE_EMAIL' par l'email de l'utilisateur concerné

-- 1. Vérifier l'état actuel de l'utilisateur
SELECT 
  u.email,
  p.subscription_plan,
  p.stripe_customer_id,
  p.stripe_subscription_id,
  p.monthly_generations_medium,
  p.monthly_generations_pro,
  p.monthly_reset_date
FROM auth.users u
JOIN public.profiles p ON p.user_id = u.id
WHERE u.email = 'VOTRE_EMAIL';

-- 2. Mettre à jour l'abonnement BASIC et réinitialiser les compteurs
UPDATE public.profiles
SET 
  subscription_plan = 'basic',
  monthly_generations_medium = 0,
  monthly_generations_pro = 0,
  monthly_reset_date = DATE_TRUNC('month', CURRENT_DATE)::DATE
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'VOTRE_EMAIL');

-- 3. Vérifier après la mise à jour
SELECT 
  u.email,
  p.subscription_plan,
  p.monthly_generations_medium,
  p.monthly_generations_pro,
  p.monthly_reset_date,
  sp.gemini_monthly_limit as "Limite MiniaMaker 2/mois",
  sp.pro_monthly_limit as "Limite Pro/mois"
FROM auth.users u
JOIN public.profiles p ON p.user_id = u.id
LEFT JOIN public.subscription_plans sp ON sp.plan_type = p.subscription_plan
WHERE u.email = 'VOTRE_EMAIL';




