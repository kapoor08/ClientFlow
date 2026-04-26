-- ────────────────────────────────────────────────────────────────────────────
-- Stage 1: install RLS policies on all tenant-scoped tables.
-- These are INERT until the corresponding tables have RLS enabled in Stage 3.
-- See scripts/rls/README.md for the staged-rollout plan.
-- ────────────────────────────────────────────────────────────────────────────

-- The active org for the current connection. Application code sets this via
-- `SET LOCAL app.current_org_id = '...'` at the start of every transaction
-- that touches tenant data (see server/db/with-tenant.ts). The GUC is
-- declared `false` so an unset value reads as empty string rather than
-- raising an error.

-- ── Work-domain tables ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS clients_tenant_isolation ON clients;
CREATE POLICY clients_tenant_isolation ON clients
  USING (organization_id = current_setting('app.current_org_id', true))
  WITH CHECK (organization_id = current_setting('app.current_org_id', true));

DROP POLICY IF EXISTS client_notes_tenant_isolation ON client_notes;
CREATE POLICY client_notes_tenant_isolation ON client_notes
  USING (organization_id = current_setting('app.current_org_id', true))
  WITH CHECK (organization_id = current_setting('app.current_org_id', true));

DROP POLICY IF EXISTS projects_tenant_isolation ON projects;
CREATE POLICY projects_tenant_isolation ON projects
  USING (organization_id = current_setting('app.current_org_id', true))
  WITH CHECK (organization_id = current_setting('app.current_org_id', true));

DROP POLICY IF EXISTS project_files_tenant_isolation ON project_files;
CREATE POLICY project_files_tenant_isolation ON project_files
  USING (organization_id = current_setting('app.current_org_id', true))
  WITH CHECK (organization_id = current_setting('app.current_org_id', true));

DROP POLICY IF EXISTS project_members_tenant_isolation ON project_members;
CREATE POLICY project_members_tenant_isolation ON project_members
  USING (organization_id = current_setting('app.current_org_id', true))
  WITH CHECK (organization_id = current_setting('app.current_org_id', true));

DROP POLICY IF EXISTS task_board_columns_tenant_isolation ON task_board_columns;
CREATE POLICY task_board_columns_tenant_isolation ON task_board_columns
  USING (organization_id = current_setting('app.current_org_id', true))
  WITH CHECK (organization_id = current_setting('app.current_org_id', true));

DROP POLICY IF EXISTS tasks_tenant_isolation ON tasks;
CREATE POLICY tasks_tenant_isolation ON tasks
  USING (organization_id = current_setting('app.current_org_id', true))
  WITH CHECK (organization_id = current_setting('app.current_org_id', true));

DROP POLICY IF EXISTS task_comments_tenant_isolation ON task_comments;
CREATE POLICY task_comments_tenant_isolation ON task_comments
  USING (organization_id = current_setting('app.current_org_id', true))
  WITH CHECK (organization_id = current_setting('app.current_org_id', true));

DROP POLICY IF EXISTS task_attachments_tenant_isolation ON task_attachments;
CREATE POLICY task_attachments_tenant_isolation ON task_attachments
  USING (organization_id = current_setting('app.current_org_id', true))
  WITH CHECK (organization_id = current_setting('app.current_org_id', true));

DROP POLICY IF EXISTS task_audit_logs_tenant_isolation ON task_audit_logs;
CREATE POLICY task_audit_logs_tenant_isolation ON task_audit_logs
  USING (organization_id = current_setting('app.current_org_id', true))
  WITH CHECK (organization_id = current_setting('app.current_org_id', true));

DROP POLICY IF EXISTS time_entries_tenant_isolation ON time_entries;
CREATE POLICY time_entries_tenant_isolation ON time_entries
  USING (organization_id = current_setting('app.current_org_id', true))
  WITH CHECK (organization_id = current_setting('app.current_org_id', true));

-- ── Billing-domain tables ──────────────────────────────────────────────────
DROP POLICY IF EXISTS subscriptions_tenant_isolation ON subscriptions;
CREATE POLICY subscriptions_tenant_isolation ON subscriptions
  USING (organization_id = current_setting('app.current_org_id', true))
  WITH CHECK (organization_id = current_setting('app.current_org_id', true));

DROP POLICY IF EXISTS invoices_tenant_isolation ON invoices;
CREATE POLICY invoices_tenant_isolation ON invoices
  USING (organization_id = current_setting('app.current_org_id', true))
  WITH CHECK (organization_id = current_setting('app.current_org_id', true));

DROP POLICY IF EXISTS usage_counters_tenant_isolation ON usage_counters;
CREATE POLICY usage_counters_tenant_isolation ON usage_counters
  USING (organization_id = current_setting('app.current_org_id', true))
  WITH CHECK (organization_id = current_setting('app.current_org_id', true));

-- ── Platform-domain tables ─────────────────────────────────────────────────
DROP POLICY IF EXISTS notifications_tenant_isolation ON notifications;
CREATE POLICY notifications_tenant_isolation ON notifications
  USING (organization_id = current_setting('app.current_org_id', true))
  WITH CHECK (organization_id = current_setting('app.current_org_id', true));

DROP POLICY IF EXISTS notification_preferences_tenant_isolation ON notification_preferences;
CREATE POLICY notification_preferences_tenant_isolation ON notification_preferences
  USING (organization_id = current_setting('app.current_org_id', true))
  WITH CHECK (organization_id = current_setting('app.current_org_id', true));

-- ── Access-domain tables ───────────────────────────────────────────────────
DROP POLICY IF EXISTS api_keys_tenant_isolation ON api_keys;
CREATE POLICY api_keys_tenant_isolation ON api_keys
  USING (organization_id = current_setting('app.current_org_id', true))
  WITH CHECK (organization_id = current_setting('app.current_org_id', true));

DROP POLICY IF EXISTS outbound_webhooks_tenant_isolation ON outbound_webhooks;
CREATE POLICY outbound_webhooks_tenant_isolation ON outbound_webhooks
  USING (organization_id = current_setting('app.current_org_id', true))
  WITH CHECK (organization_id = current_setting('app.current_org_id', true));

DROP POLICY IF EXISTS audit_logs_tenant_isolation ON audit_logs;
CREATE POLICY audit_logs_tenant_isolation ON audit_logs
  USING (organization_id = current_setting('app.current_org_id', true))
  WITH CHECK (organization_id = current_setting('app.current_org_id', true));
