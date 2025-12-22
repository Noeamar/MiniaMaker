-- Create table to track anonymous (non-authenticated) usage by IP
CREATE TABLE IF NOT EXISTS public.anonymous_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip TEXT NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on IP for fast lookups
CREATE INDEX IF NOT EXISTS idx_anonymous_usage_ip ON public.anonymous_usage(ip);

-- Create index on used_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_anonymous_usage_used_at ON public.anonymous_usage(used_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.anonymous_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to read/write (for Edge Functions)
CREATE POLICY "Service role can manage anonymous_usage"
  ON public.anonymous_usage
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Deny all other access (public can't read/write)
CREATE POLICY "Public cannot access anonymous_usage"
  ON public.anonymous_usage
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Optional: Create a function to clean up old records (older than 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_anonymous_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.anonymous_usage
  WHERE used_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Optional: Create a scheduled job to run cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-anonymous-usage', '0 0 * * *', 'SELECT public.cleanup_old_anonymous_usage()');


