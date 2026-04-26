-- ────────────────────────────────────────────────────────────────────────────
-- Stage 4: enable RLS on remaining tables (after Stage 3 verified for the
-- pilot pair). Run this AFTER `setTenantContext()` is wired into every
-- authenticated handler. Until then, queries against these tables will
-- return zero rows (because the GUC is unset).
-- ────────────────────────────────────────────────────────────────────────────

-- Stage 3 (run first, separately, so you can watch for breakage):
--   ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Stage 4 (this file):
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_board_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Stage 5 (run only after several weeks of clean Stage 4 operation):
--   ALTER TABLE clients FORCE ROW LEVEL SECURITY;
--   -- repeat for each table - this binds RLS even on the owner role.
