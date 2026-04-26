/**
 * Knowledge-base article content. Stored in code (not a CMS) so it ships
 * with the deployment, gets type-checked, and shows up in `git blame` for
 * editing history. The trade-off: no live editing without a redeploy. For
 * an early-stage SaaS that's the right shape - article churn is low and
 * non-engineers can still PR Markdown.
 *
 * Content is plain Markdown (rendered by react-markdown + remark-gfm).
 *
 * Adding a new article:
 *   1. Append an entry below with a unique slug.
 *   2. The /help index will pick it up automatically via the category match.
 *   3. The sitemap regenerates on the next build.
 */

export type KbCategory =
  | "getting-started"
  | "client-management"
  | "projects-tasks"
  | "billing"
  | "account-security"
  | "integrations";

export type KbArticle = {
  slug: string;
  title: string;
  category: KbCategory;
  /** One-line description shown in lists and SEO meta. */
  excerpt: string;
  /** Markdown body. */
  body: string;
  updatedAt: string; // YYYY-MM-DD
};

// ──────────────────────────────────────────────────────────────────────────
// Articles
// ──────────────────────────────────────────────────────────────────────────

export const KB_ARTICLES: KbArticle[] = [
  {
    slug: "set-up-your-workspace",
    title: "Set up your workspace in 5 minutes",
    category: "getting-started",
    excerpt: "A guided walkthrough from sign-up to your first client and project.",
    updatedAt: "2026-04-26",
    body: `
After signing up at [client-flow.in/auth/sign-up](/auth/sign-up), the
onboarding flow walks you through five steps. You can complete it now or
skip ahead and come back later.

### 1. Verify your email

Check your inbox for a verification message. The link expires after 24
hours - request a new one from your account settings if it's lapsed.

### 2. Pick a workspace name and timezone

Your workspace name shows up in invoices and on the client portal. Pick
something your customers will recognise. Timezone drives every "due date"
display in the app.

### 3. Add your branding (optional)

Upload a logo and pick a brand color in **Settings → Branding**. The brand
color propagates across buttons, badges, sidebar accents, and the client
portal - so external clients see a consistent look.

### 4. Create your first client

Either click **"Create"** in the sidebar or use the ⌘K command palette
(press \`?\` for the full shortcut list). Required fields are name and
status; everything else is optional.

### 5. Invite your team

Go to **Settings → Team** and send invitations. Each invite carries a
specific role (Owner, Admin, Manager, Member, or Client). Members get a
24-hour window to accept; expired invitations auto-cancel and can be
re-sent.

That's it. Common next steps: create your first project, set up an API
key for integrations, or wire up [outbound webhooks](/help/configure-webhooks).
    `.trim(),
  },
  {
    slug: "invite-your-team",
    title: "Invite your team",
    category: "getting-started",
    excerpt:
      "Send invitations, choose roles, and resend or revoke invites that haven't been accepted.",
    updatedAt: "2026-04-26",
    body: `
Invitations live at **Settings → Invitations**.

### Sending an invitation

Click **New Invitation**. Enter:

- **Email** - any address; if the recipient already has an account on
  another workspace, the invitation is added to their existing account.
- **Role** - controls what they can see and do (see roles below).

The recipient gets an email with a one-time-use link. Links expire after
24 hours - the dashboard shows expiry status next to each pending invite.

### Roles at a glance

| Role | Typical use | Permissions |
| ---- | ----------- | ----------- |
| Owner | Founders, leadership | Full access including billing and workspace deletion |
| Admin | Operations leads | Team management, settings, all customer-facing features |
| Manager | Project leads | Create/edit clients, projects, tasks; invite team members |
| Member | Individual contributors | Standard read/write on assigned work |
| Client | External customers | Read-only access to the client portal only |

You can also create custom permission overrides for individual members at
**Settings → Team → [member name] → Permissions**.

### Resending or revoking

Pending invitations have **Resend** and **Revoke** actions in the table.
Revoking is immediate: the link stops working even if it hasn't expired
yet.

### Limits

The Starter plan caps team size at 5 members; Professional at 25. Hitting
the cap surfaces an upgrade prompt at invite time.
    `.trim(),
  },
  {
    slug: "add-your-first-client",
    title: "Add your first client",
    category: "client-management",
    excerpt:
      "How to create a client record, link projects, and capture contact details that feed into invoices.",
    updatedAt: "2026-04-26",
    body: `
Clients are the top-level entity in ClientFlow. Every project links to
exactly one client; every invoice carries the client's billing details.

### Create a client

Go to **Clients → New Client** (or press \`g c\` then click **New
Client**). Fill in:

- **Name** - the company name as you want it to appear on invoices.
- **Status** - active / inactive / archived. Inactive clients are still
  searchable but hidden from default views; archived clients are hidden
  from search too.
- **Primary contact** - name, email, phone. The email is used as the
  default \`Bill To\` for invoices and as the recipient for client portal
  invitations.

### Linking projects

From the client detail page, click **New Project** to create a project
under this client. You can also re-link an existing project from the
project's edit page.

### Giving the client portal access

If you want the client to see their own projects and invoices, go to the
client's detail page → **Portal Access** → **Enable**. They'll get an
email invitation to set up a password.

The client only sees data for projects you've explicitly linked to them -
they have no visibility into your other clients or internal workspace.
    `.trim(),
  },
  {
    slug: "kanban-best-practices",
    title: "Use the Kanban board effectively",
    category: "projects-tasks",
    excerpt:
      "Set up your columns, drag-and-drop tasks, and keep the board in sync with your team's actual flow.",
    updatedAt: "2026-04-26",
    body: `
Every project gets a Kanban board with customizable columns. The default
set is **Todo → In Progress → Testing → Done**, but you can rename, add,
remove, or re-order columns at the workspace level (**Settings → Task
Columns**).

### Configuring columns

A column has:

- **Name** - what users see on the board.
- **Color** - shows up as the column header accent.
- **Type** (optional) - one of \`todo\`, \`in_progress\`, \`testing_qa\`,
  \`completed\`. Setting this lets reports and analytics know which states
  count as "done" or "active" without hard-coding column names.

Drag column headers in the settings page to re-order. The order applies
across every project in the workspace.

### Working with tasks

- **Drag-and-drop** moves a task between columns. The change is saved
  immediately and shows up in the task's audit log.
- **Click a task** to open the detail sheet with comments, attachments,
  subtasks, and the full activity history.
- **Mention teammates** with \`@\` in comments to notify them.
- **Assign multiple people** with the assignee picker - all assignees
  receive due-date and overdue notifications.

### Keyboard shortcuts on the board

- \`?\` opens the global shortcut help
- \`g t\` jumps to the Tasks page from anywhere
- ⌘K (or Ctrl-K) opens the command palette to find a specific task

### Tips

- Limit work-in-progress per column. ClientFlow doesn't enforce WIP
  limits but most teams find that a column-name suffix like
  \`In Progress (max 3)\` is enough as a social signal.
- Use subtasks for checklists, not for sub-projects. If a task spawns
  more than ~5 subtasks, it's usually a sign it should be its own task
  with dependencies.
    `.trim(),
  },
  {
    slug: "understand-your-invoice",
    title: "Understand your invoice",
    category: "billing",
    excerpt: "What every line on a ClientFlow-issued invoice means, including India GST breakdown.",
    updatedAt: "2026-04-26",
    body: `
ClientFlow issues two kinds of invoices: **subscription invoices**
(generated automatically by Stripe when you renew or upgrade) and
**manual invoices** (created by you for client billing). The structure
is the same for both.

### Header

- **Invoice number** - subscription invoices use Stripe's number
  (e.g. \`A1B2C3D4-0001\`); manual invoices use \`INV-NNNN\` from your
  workspace counter.
- **Bill To** - the customer's billing details. For your own
  subscription, this is your workspace name. For manual invoices, it's
  the linked client's primary contact.
- **Issue date** and **Due date** - default 30 days net.

### Line items

Each line has a description, quantity, unit price, and total. You can
add notes per line for billing transparency.

### Tax

If you have a GSTIN on file (set at **Settings → GST**) and you're
selling to an Indian buyer, the invoice carries:

- **HSN/SAC code** - 998314 (the standard code for SaaS)
- **CGST + SGST** for intra-state sales (your state matches the buyer's)
- **IGST** for inter-state sales

For non-Indian buyers or if Stripe Tax is enabled at the workspace level,
tax is calculated by Stripe based on the buyer's address.

### Payment

The invoice URL takes the buyer to a hosted Stripe payment page. We
support card payments globally and UPI / netbanking for India. After
payment, you receive a webhook event (\`invoice.paid\`) and the invoice
status flips to **Paid** in your dashboard.

### Refunds

Issued via the Stripe dashboard or the admin refund flow. The refunded
amount is captured back on the original invoice (\`amountRefundedCents\`)
and dispatches an outbound \`invoice.refunded\` webhook.
    `.trim(),
  },
  {
    slug: "change-or-cancel-your-plan",
    title: "Change or cancel your plan",
    category: "billing",
    excerpt:
      "How to upgrade, downgrade, or cancel - including what happens to your data after cancellation.",
    updatedAt: "2026-04-26",
    body: `
Plan management lives at **Settings → Billing → Choose a plan**.

### Upgrade

Pick the plan you want and click **Switch to this plan**. You'll see a
proration preview showing exactly what's owed today (and the credit, if
you're moving in the cheaper direction) before you confirm. The change is
immediate - your account capabilities update on the next page load.

### Downgrade

Same flow. Stripe pro-rates the unused portion of your current plan and
applies it as credit toward your next invoice. Your data stays intact;
only the plan-level limits change. If you exceed a downgraded plan's caps
(say, you have 30 active projects but the cheaper plan caps at 20),
you'll keep read access to everything but can't create new projects until
you're back under the limit or upgrade.

### Cancel at period end

Click **Cancel subscription** in the billing portal. Cancellation takes
effect at the end of your current billing period - no proration, no
mid-cycle refund, but you keep full access until then. The dashboard
shows a banner with the exact end-date.

### Cancel immediately

Contact support. We can issue a prorated refund and end the subscription
the same day if needed for compliance reasons.

### What happens to your data

Cancelled accounts retain full data for 30 days, in case you change your
mind. After 30 days the data enters a deletion grace period (another 30
days during which you can restore via support), then is anonymised
permanently per our [GDPR policy](/help/gdpr-data-export-and-deletion).
    `.trim(),
  },
  {
    slug: "set-up-two-factor-authentication",
    title: "Set up two-factor authentication (2FA)",
    category: "account-security",
    excerpt: "Add a TOTP app or use email-OTP as a fallback for sign-in.",
    updatedAt: "2026-04-26",
    body: `
ClientFlow supports two factors for account protection: **TOTP** via any
authenticator app, and **email-OTP** as a fallback for users without
their password manager.

### Enable TOTP

1. Go to **Settings → Security → Two-Factor Authentication**.
2. Click **Enable 2FA**. We'll show a QR code.
3. Open your authenticator app (Authy, 1Password, Google Authenticator,
   etc.) and scan the QR code. The app will start generating six-digit
   codes that rotate every 30 seconds.
4. Enter the current code to confirm setup.
5. **Save your backup codes.** These are 10 single-use codes that let
   you sign in if you lose access to your authenticator. Print them or
   store them in a password manager - we don't keep a recoverable copy.

After enablement, sign-in flow becomes: email + password → 6-digit code.

### Email-OTP fallback

If you've forgotten your password and don't want to wait for a reset
email, use the email-OTP path:

1. From the sign-in page, click **"Email me a sign-in code"**.
2. Enter your email address.
3. Check your inbox for a 6-digit code (expires in 10 minutes).
4. Enter the code.

Email-OTP works whether or not you have 2FA enabled. With 2FA enabled,
you'll still need to enter your TOTP code after the email-OTP step.

### Regenerating backup codes

If you've used up your backup codes or lost them, regenerate from
**Settings → Security → Backup Codes**. The old codes invalidate
immediately.

### Recommended for organization owners

If you're an owner or admin, enable 2FA. Account compromise of an owner
account would let an attacker delete the entire workspace.
    `.trim(),
  },
  {
    slug: "manage-api-keys",
    title: "Manage API keys",
    category: "account-security",
    excerpt: "Generate, rotate, and revoke API keys for integrations and the public REST API.",
    updatedAt: "2026-04-26",
    body: `
API keys authenticate calls to the public REST API at \`/api/v1\` and
to integrations you build yourself.

### Generate a key

Go to **Settings → API Keys → New Key**.

- **Name** - a description of the integration (e.g. "Zapier production",
  "internal reporting"). This shows up in audit logs alongside any action
  the key takes.
- **Expiry** - 30 days, 90 days, 1 year, or never. Pick the shortest
  window that works for your integration.

The full key is shown **once** - copy it now. We store only a SHA-256
hash, so we cannot recover the raw key later.

### Use the key

Pass it as the \`X-API-Key\` header on every request:

\`\`\`http
GET /api/v1/clients HTTP/1.1
Host: client-flow.in
X-API-Key: cf_YOUR_KEY_HERE
\`\`\`

The full API spec is at [/api/openapi.json](/api/openapi.json) - import
into Postman, Insomnia, or generate a typed SDK.

### Rate limits and quotas

Each key gets:

- **1,000 requests per minute** sliding window. Exceed it and you get a
  429 response; wait a few seconds and retry.
- **Monthly call counter** visible in the API Keys table. Resets on the
  1st of each month.

### Rotate on schedule

Best practice: rotate keys every 90 days. The flow:

1. Generate the new key.
2. Deploy the new key to your integration.
3. Verify it's working (check the **Last Used** timestamp).
4. Revoke the old key.

### Revoking

Click **Revoke** on a key to stop it working immediately. There's no
grace period. Use **Delete** to also remove it from the table - the audit
trail of past actions stays.

### What to do if a key leaks

If a key ends up in a public repository or screenshot:

1. Revoke it immediately from the API Keys page.
2. Generate a fresh key.
3. Audit recent activity at **Admin → Audit Logs** - filter by the
   key's prefix to see what was done.
4. If the leak exposed customer data, follow your incident response
   playbook.
    `.trim(),
  },
  {
    slug: "gdpr-data-export-and-deletion",
    title: "Export or delete your data (GDPR)",
    category: "account-security",
    excerpt: "Self-service data export and account deletion under GDPR Articles 17 and 20.",
    updatedAt: "2026-04-26",
    body: `
We support self-service data export (Article 20 - right to data
portability) and self-service account deletion (Article 17 - right to
erasure). Both flows are end-to-end without needing to contact support.

### Export your data

Go to **Settings → Data → Download My Data**.

You receive a JSON file containing:

- Your account profile and preferences.
- Every organization you belong to.
- Activity logs scoped to your user.
- Work products you created (clients, projects, tasks, comments,
  attachments metadata).

Sensitive fields are redacted: session tokens, OAuth refresh tokens,
password hashes, 2FA secrets, API key hashes. The export request itself
is audit-logged.

### Schedule deletion

Go to **Settings → Data → Delete My Account**.

Account deletion uses a **30-day grace period**. During the grace period:

- A banner appears across the app showing the deletion date.
- You can sign in normally.
- You can cancel deletion from the same settings page (or the banner)
  with a single click.

After the grace period, a nightly cron job runs the anonymisation. We:

- NULL the foreign keys on rows you authored (so the work products
  remain in the workspace but are attributed to "Deleted user").
- Hard-delete your sessions, OAuth accounts, notifications, and push
  subscriptions.
- Replace your name and email with placeholder values.

This is irreversible.

### Sole-owner blocker

If you're the sole owner of an organization with active members, deletion
is blocked - you must first either transfer ownership or remove the other
members. This protects the workspace from being orphaned.

### Email opt-outs

Independent of account deletion, you can:

- **Click "Unsubscribe" on any email** - adds your address to our
  suppression list for non-essential mail.
- **Granular opt-outs** at **Notifications → Preferences → Email
  Categories** - separate toggles for product updates, billing nudges,
  and marketing.

Critical email (auth, billing, security) is sent regardless of opt-outs;
this is required by law in most jurisdictions.
    `.trim(),
  },
  {
    slug: "configure-webhooks",
    title: "Configure outbound webhooks",
    category: "integrations",
    excerpt:
      "Receive event payloads from ClientFlow into your own systems with HMAC verification and replay support.",
    updatedAt: "2026-04-26",
    body: `
Outbound webhooks let your systems react to events in ClientFlow in
real time - new tasks created, invoices paid, members added, and more.

### Add an endpoint

Go to **Settings → Webhooks → New Endpoint**:

- **URL** - your HTTPS endpoint. HTTP is rejected.
- **Events** - tick the events you want delivered. The full list:
  - \`project.{created,updated,deleted}\`
  - \`task.{created,updated,completed}\`
  - \`client.{created,updated}\`
  - \`invoice.{paid,overdue,refunded}\`
  - \`team.{member_added,member_removed}\`

Each endpoint gets a unique signing secret shown once after creation.

### Verifying signatures

Every delivery includes an \`X-ClientFlow-Signature\` header containing
\`sha256=<HMAC>\`. Compute the HMAC-SHA256 of the raw request body using
your signing secret and compare in constant time:

\`\`\`js
import crypto from "crypto";

function verifyWebhook(rawBody, signatureHeader, secret) {
  const provided = signatureHeader.replace(/^sha256=/, "");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(provided, "hex"),
    Buffer.from(expected, "hex"),
  );
}
\`\`\`

Reject the request with 401 if the signature doesn't match. Always use a
constant-time comparison; a regular \`===\` leaks timing information.

### Retries

Failed deliveries (non-2xx response, timeout, or connection error) retry
**3 times** with exponential backoff (1s, 2s, 4s). After the final
failure, the delivery is marked \`exhausted\` and visible in our admin
DLQ - support can replay it once your endpoint is healthy.

4xx responses (other than 408 / 429) are classified as **permanent
failures** - we don't retry, on the assumption that 4xx means a request
your endpoint will never accept. Use 5xx for transient failures.

### Test deliveries

Click **Send Test Event** on any endpoint to fire a synthetic
\`webhook.test\` event. Lets you verify signature handling without
needing to trigger a real workspace event.

### Disable an endpoint

Click **Disable** to pause delivery without deleting the configuration.
The endpoint stops receiving events but the signing secret stays the
same when you re-enable.
    `.trim(),
  },
  {
    slug: "why-am-i-not-receiving-emails",
    title: "Why am I not receiving emails?",
    category: "account-security",
    excerpt: "Troubleshooting the most common reasons emails go missing.",
    updatedAt: "2026-04-26",
    body: `
If you (or your team) aren't getting expected ClientFlow emails, work
through this list in order.

### 1. Check your spam folder

Especially for the first email from a new sender. After you mark our
mail as "Not spam" once, future deliveries usually land in the inbox.

### 2. Check the suppression list

If you previously clicked **Unsubscribe** on any email, your address is
on our suppression list - we won't send non-essential mail to you. To
re-subscribe, sign in and toggle the categories you want at
**Notifications → Preferences → Email Categories**.

Critical mail (verify-email, password reset, payment failed, security
alerts) bypasses suppressions and should still arrive.

### 3. Check your category opt-outs

Even without unsubscribing entirely, you may have opted out of a
specific category. Same path: **Notifications → Preferences → Email
Categories**. The three categories are:

- **Product updates** - task notifications, mentions, file shares.
- **Billing nudges** - usage warnings, plan suggestions (NOT critical
  billing events).
- **Announcements & newsletters** - product launches and tips.

### 4. Check your address is correct

Sign in and verify the email at **Settings → Account**. Auto-correct on
mobile keyboards is a common culprit.

### 5. Check your domain isn't blocking

Corporate IT departments sometimes block emails from less-known senders.
Ask your admin to allowlist:

- Sending domain: \`mail.client-flow.in\`
- IP ranges published by [Resend](https://resend.com)

### 6. Hard bounces

If you previously had a typo in your address (or your mailbox was full),
our send provider may have classified your address as a hard bounce. We
suppress those automatically. Update your email at **Settings → Account**
and the suppression clears for the new address.

### Still nothing?

Contact support at the email shown on our [status page](/status). Include
your account email and the type of email you're missing - we can check
the delivery log and re-send.
    `.trim(),
  },
];

// ──────────────────────────────────────────────────────────────────────────
// Lookups
// ──────────────────────────────────────────────────────────────────────────

export function getArticleBySlug(slug: string): KbArticle | undefined {
  return KB_ARTICLES.find((a) => a.slug === slug);
}

export function getArticlesByCategory(category: KbCategory): KbArticle[] {
  return KB_ARTICLES.filter((a) => a.category === category);
}

export const KB_CATEGORY_META: Record<KbCategory, { title: string; description: string }> = {
  "getting-started": {
    title: "Getting Started",
    description: "Setup, first project, inviting your team.",
  },
  "client-management": {
    title: "Client Management",
    description: "Adding clients, contacts, portal access.",
  },
  "projects-tasks": {
    title: "Projects & Tasks",
    description: "Creating projects, Kanban workflows, task management.",
  },
  billing: {
    title: "Billing & Subscriptions",
    description: "Plans, invoices, payment methods, India GST.",
  },
  "account-security": {
    title: "Account & Security",
    description: "2FA, API keys, GDPR, troubleshooting.",
  },
  integrations: {
    title: "Integrations",
    description: "Outbound webhooks, public REST API.",
  },
};
