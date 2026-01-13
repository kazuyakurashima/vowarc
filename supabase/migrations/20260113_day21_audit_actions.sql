-- Day21 Audit Actions (Ticket 007)
-- Extends audit_logs action constraint to include Day21 events

-- Drop existing constraint and add new one with Day21 actions
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_action_check;

ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_action_check CHECK (action IN (
  -- Memory system actions
  'memory_created', 'memory_updated', 'memory_deleted',
  'deletion_requested', 'deletion_approved', 'deletion_rejected',
  -- Day21 actions
  'day21_continue', 'day21_stop'
));
