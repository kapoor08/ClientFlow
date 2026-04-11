import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = process.cwd();
const DATA_FILE = path.join(ROOT, "data", "emailTemplates.ts");
const EMAILS_DIR = path.join(ROOT, "emails");
const COMMON_DIR = path.join(EMAILS_DIR, "common");
const CONTENT_DIR = path.join(EMAILS_DIR, "content");
const TEMPLATES_DIR = path.join(EMAILS_DIR, "templates");

// ─── Extract templates from TypeScript source ────────────────────────────────

function extractTemplates(fileContent) {
  const match = fileContent.match(
    /const templates: EmailTemplate\[\] = (\[[\s\S]*?\n\]);\r?\n\r?\n\/\/ Group by category/,
  );
  if (!match) {
    throw new Error(
      "Unable to locate the template array in data/emailTemplates.ts",
    );
  }
  return vm.runInNewContext(match[1]);
}

// ─── Text helpers ─────────────────────────────────────────────────────────────

function normalizeText(value) {
  return String(value)
    .replaceAll("\u2014", "-")
    .replaceAll("\u2192", "->")
    .replaceAll("\u2022\u2022\u2022\u2022", "****")
    .replaceAll("\u2026", "...")
    .replaceAll("\u26A0", "Warning:")
    .replaceAll("\u00A9", "(c)")
    .replaceAll("\u00B7", "-");
}

function escapeHtml(value) {
  return normalizeText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function highlightVariables(text) {
  return text.replace(
    /(\{\{[^}]+\}\})/g,
    '<span style="color:#2563eb;font-weight:500;">$1</span>',
  );
}

function renderParagraph(text) {
  return highlightVariables(escapeHtml(text.trim())).replaceAll("\n", "<br />");
}

// ─── Content (body fragment) renderer ────────────────────────────────────────

function renderContent(previewBody) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let html = "";

  const normalized = normalizeText(previewBody);

  for (const match of normalized.matchAll(linkRegex)) {
    const [fullMatch, label, href] = match;
    const matchIndex = match.index ?? 0;
    const before = normalized.slice(lastIndex, matchIndex).trim();

    if (before) {
      html += `<p style="margin:0 0 16px;font-size:15px;line-height:1.75;color:#374151;">${renderParagraph(before)}</p>\n`;
    }

    html += `<div style="margin:20px 0;">\n  <a href="${escapeHtml(href)}" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;letter-spacing:-0.1px;">${escapeHtml(label)}</a>\n</div>\n`;

    lastIndex = matchIndex + fullMatch.length;
  }

  const after = normalized.slice(lastIndex).trim();
  if (after) {
    html += `<p style="margin:0;font-size:15px;line-height:1.75;color:#374151;">${renderParagraph(after)}</p>\n`;
  }

  return html.trim();
}

// ─── Common partials ──────────────────────────────────────────────────────────

const HEADER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{{subject}}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Source+Sans+3:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f3f4f6;padding:40px 16px;font-family:'Sora',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;">
          <!-- Email card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08),0 1px 2px rgba(0,0,0,0.06);">
              <!-- Logo -->
              <div style="padding:36px 40px 20px;text-align:center;">
                <span style="font-size:22px;font-weight:700;color:#2563eb;letter-spacing:-0.3px;font-family:'Sora',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">ClientFlow</span>
              </div>
              <!-- Divider -->
              <div style="height:1px;background-color:#e5e7eb;"></div>
              <!-- Body -->
              <div style="padding:28px 40px;">`;

const FOOTER_HTML = `              </div>
              <!-- Footer divider -->
              <div style="margin:0 40px;height:1px;background-color:#e5e7eb;"></div>
              <!-- Footer -->
              <div style="padding:18px 40px 28px;text-align:center;">
                <p style="margin:0;font-size:12px;color:#9ca3af;font-family:'Sora',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">(c) 2026 ClientFlow &mdash; All rights reserved</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// ─── Combine header + content + footer ───────────────────────────────────────

function buildTemplate(contentHtml, subject, audience) {
  const header = HEADER_HTML.replaceAll("{{subject}}", escapeHtml(subject)).replaceAll(
    "{{audience}}",
    escapeHtml(audience),
  );
  return `${header}\n${contentHtml}\n${FOOTER_HTML}`;
}

// ─── Index page ───────────────────────────────────────────────────────────────

function renderIndexHtml(templates) {
  const rows = templates
    .map(
      (t) => `
        <tr>
          <td style="padding:12px 14px;border-bottom:1px solid #e5e7eb;font-family:'JetBrains Mono',Consolas,monospace;font-size:12px;color:#374151;">${escapeHtml(t.slug)}</td>
          <td style="padding:12px 14px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">${escapeHtml(t.module)}</td>
          <td style="padding:12px 14px;border-bottom:1px solid #e5e7eb;font-size:13px;">
            <span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;background:${t.priority === "P0" ? "#fee2e2" : t.priority === "P1" ? "#fef9c3" : "#f3f4f6"};color:${t.priority === "P0" ? "#dc2626" : t.priority === "P1" ? "#854d0e" : "#6b7280"};">${escapeHtml(t.priority)}</span>
          </td>
          <td style="padding:12px 14px;border-bottom:1px solid #e5e7eb;font-size:13px;"><a href="./${escapeHtml(t.slug)}.html" style="color:#2563eb;text-decoration:none;font-weight:500;">${escapeHtml(t.subject)}</a></td>
        </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ClientFlow Email Templates</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Source+Sans+3:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Sora',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:1000px;margin:0 auto;padding:40px 24px;">
    <div style="margin-bottom:28px;">
      <h1 style="margin:0 0 6px;font-size:28px;font-weight:700;color:#111827;letter-spacing:-0.5px;">ClientFlow Email Templates</h1>
      <p style="margin:0;font-size:14px;color:#6b7280;">Generated from data/emailTemplates.ts &mdash; ${templates.length} templates total</p>
    </div>
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb;">
            <th style="padding:12px 14px;text-align:left;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#6b7280;">Slug</th>
            <th style="padding:12px 14px;text-align:left;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#6b7280;">Module</th>
            <th style="padding:12px 14px;text-align:left;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#6b7280;">Priority</th>
            <th style="padding:12px 14px;text-align:left;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#6b7280;">Preview</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>
</body>
</html>`;
}

// ─── Cleanup old root-level HTML files ───────────────────────────────────────

function cleanupRootHtmlFiles() {
  const entries = fs.readdirSync(EMAILS_DIR, { withFileTypes: true });
  let count = 0;
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".html")) {
      fs.unlinkSync(path.join(EMAILS_DIR, entry.name));
      count++;
    }
  }
  return count;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const fileContent = fs.readFileSync(DATA_FILE, "utf8");
  const templates = extractTemplates(fileContent);

  // Create output directories
  fs.mkdirSync(COMMON_DIR, { recursive: true });
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });

  // Write common partials
  fs.writeFileSync(path.join(COMMON_DIR, "header.html"), HEADER_HTML);
  fs.writeFileSync(path.join(COMMON_DIR, "footer.html"), FOOTER_HTML);

  // Generate content + combined templates
  for (const template of templates) {
    const contentHtml = renderContent(template.previewBody);

    // /emails/content/[slug].html - body fragment only
    fs.writeFileSync(
      path.join(CONTENT_DIR, `${template.slug}.html`),
      contentHtml,
    );

    // /emails/templates/[slug].html - full combined email
    fs.writeFileSync(
      path.join(TEMPLATES_DIR, `${template.slug}.html`),
      buildTemplate(contentHtml, template.subject, template.audience),
    );
  }

  // Write index inside templates/
  fs.writeFileSync(
    path.join(TEMPLATES_DIR, "index.html"),
    renderIndexHtml(templates),
  );

  // Remove stale flat HTML files from emails/ root
  const removed = cleanupRootHtmlFiles();

  console.log(`✓ common/   - header.html + footer.html`);
  console.log(`✓ content/  - ${templates.length} body fragments`);
  console.log(`✓ templates/ - ${templates.length} combined emails + index.html`);
  if (removed > 0) console.log(`✓ Removed ${removed} stale files from emails/ root`);
}

main();
