-- VowArc Violation Detection Cron Job
-- Ticket 016: Contract Violation Protocol (MVP)
-- Schedules daily violation checks via pg_cron

-- Note: pg_cron must be enabled in Supabase project settings
-- This migration creates the cron schedule for violation detection

-- ============================================
-- ENABLE PG_CRON EXTENSION (if not already enabled)
-- ============================================
-- Note: This may require enabling via Supabase Dashboard:
-- Project Settings > Database > Extensions > pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- SCHEDULE DAILY VIOLATION CHECK
-- Runs at 6:00 AM JST (21:00 UTC previous day)
-- ============================================
-- Remove existing job if exists (for idempotency)
SELECT cron.unschedule('daily-violation-check')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-violation-check'
);

-- Schedule the violation check job
-- Calls the Edge Function via pg_net
SELECT cron.schedule(
  'daily-violation-check',           -- job name
  '0 21 * * *',                       -- 6:00 AM JST (21:00 UTC)
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/check-violations',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ============================================
-- ALTERNATIVE: Manual invocation function
-- For testing or manual triggering
-- ============================================
CREATE OR REPLACE FUNCTION trigger_violation_check()
RETURNS void AS $$
BEGIN
  PERFORM net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/check-violations',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role only
REVOKE ALL ON FUNCTION trigger_violation_check() FROM PUBLIC;

-- ============================================
-- SETUP NOTES FOR PRODUCTION
-- ============================================
-- 1. Enable pg_cron extension in Supabase Dashboard
-- 2. Enable pg_net extension in Supabase Dashboard
-- 3. Set app.supabase_url and app.service_role_key in Database Settings
--    Or use Supabase secrets management
--
-- Alternative: Use Supabase Edge Function scheduled invocation
-- via supabase functions deploy with --schedule flag
