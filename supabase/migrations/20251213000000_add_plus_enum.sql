-- Step 1: Add 'plus' to enum (must be run FIRST in a separate transaction)
-- This migration must be applied BEFORE 20251213000001_update_subscription_plans.sql

-- Add 'plus' to enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'plus' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')) THEN
    ALTER TYPE public.subscription_plan ADD VALUE 'plus';
  END IF;
END $$;




