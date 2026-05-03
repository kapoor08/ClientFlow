import "server-only";

/**
 * Slack Block Kit payload builders.
 *
 * The colored sidebar comes from the legacy `attachments[].color` property -
 * Block Kit doesn't have a first-class color primitive, so cards that want
 * a side-bar swatch wrap their blocks inside an attachment. Plain
 * notifications skip attachments and use top-level `blocks`.
 */

export type SimpleMessageInput = {
  title: string;
  body?: string;
  actionUrl?: string;
  actionLabel?: string;
};

export function buildSimpleMessage(input: SimpleMessageInput): Record<string, unknown> {
  const blocks: Array<Record<string, unknown>> = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: input.body ? `*${input.title}*\n${input.body}` : `*${input.title}*`,
      },
    },
  ];

  if (input.actionUrl) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: input.actionLabel ?? "Open in ClientFlow" },
          url: input.actionUrl,
          style: "primary",
        },
      ],
    });
  }

  return { text: input.title, blocks };
}

// ─── Task card ─────────────────────────────────────────────────────────────────

export type TaskCardField = { label: string; value: string };

export type TaskCardInput = {
  /** Top context line, e.g. "Lakshay Kapoor created a task". Supports mrkdwn. */
  contextLine: string;
  /** Card title. Pass plain text - the builder bolds it. */
  title: string;
  /** Subtitle line under the title, e.g. "Task in *Prop Firm Genie*". Supports mrkdwn. */
  subtitle?: string;
  /**
   * Compact secondary metadata line rendered as a small context element
   * directly under the subtitle. Use for change summaries, column moves -
   * anything that's metadata about the action, not primary content.
   * Renders smaller than `body` and consumes one block instead of two.
   */
  metaLine?: string;
  /**
   * Primary content body (e.g. comment text). Rendered as a full section
   * block - heavier visual weight than `metaLine`. Use only when the
   * content IS the message, not metadata about it.
   */
  body?: string;
  /** Two-column key/value grid. Slack renders 2 fields per row. */
  fields?: TaskCardField[];
  /** Hex color for the left sidebar (e.g. "#2563eb"). */
  color: string;
  /** "Open task" button link. Omit to render no button. */
  actionUrl?: string;
  actionLabel?: string;
};

/**
 * Map task priority/status/action to a sensible side-bar color. Keeps the
 * Slack feed scannable without requiring user customization.
 */
export const SLACK_COLORS = {
  blue: "#2563eb", // created / moved (neutral activity)
  amber: "#d97706", // updated
  green: "#16a34a", // status: done
  red: "#dc2626", // deleted / overdue
  slate: "#475569", // commented (low-emphasis)
} as const;

export function colorForPriority(priority: string | null | undefined): string {
  switch ((priority ?? "").toLowerCase()) {
    case "urgent":
    case "high":
      return SLACK_COLORS.red;
    case "medium":
      return SLACK_COLORS.amber;
    case "low":
      return SLACK_COLORS.green;
    default:
      return SLACK_COLORS.blue;
  }
}

/**
 * Visual color cue for priority. Slack mrkdwn doesn't render colored pills
 * (the screenshot's "High" badge uses Slack Lists, not regular messages),
 * so we approximate with unicode dots that render consistently across web,
 * desktop, and mobile clients.
 */
export function priorityEmoji(priority: string | null | undefined): string {
  switch ((priority ?? "").toLowerCase()) {
    case "urgent":
    case "high":
      return "🔴";
    case "medium":
      return "🟠";
    case "low":
      return "🟢";
    default:
      return "⚪";
  }
}

export function statusEmoji(status: string | null | undefined): string {
  switch ((status ?? "").toLowerCase()) {
    case "done":
      return "✅";
    case "in_progress":
      return "🟡";
    case "review":
      return "🟣";
    case "blocked":
      return "⛔";
    case "todo":
    default:
      return "🔵";
  }
}

function escapeMrkdwn(s: string): string {
  // Block Kit mrkdwn treats <, >, & specially. Escape them so user-provided
  // text (task titles, comment snippets, project names) renders verbatim.
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildTaskCard(input: TaskCardInput): Record<string, unknown> {
  const innerBlocks: Array<Record<string, unknown>> = [];

  // Title row: bold text in a section. The bot avatar (set in Slack app's
  // Display Information) provides identity, so we don't need an emoji prefix.
  innerBlocks.push({
    type: "section",
    text: { type: "mrkdwn", text: `*${escapeMrkdwn(input.title.slice(0, 200))}*` },
  });

  // Subtitle + meta line collapse into a single context block when both are
  // present - keeps the card under Slack's "Show more" auto-collapse threshold
  // (~5-6 blocks) so the action button stays visible without a click.
  const contextElements: Array<Record<string, unknown>> = [];
  if (input.subtitle) {
    contextElements.push({ type: "mrkdwn", text: input.subtitle });
  }
  if (input.metaLine) {
    contextElements.push({ type: "mrkdwn", text: input.metaLine });
  }
  if (contextElements.length > 0) {
    innerBlocks.push({ type: "context", elements: contextElements });
  }

  // Primary content body (only used when content IS the message - e.g. a
  // comment snippet). Skipped for metadata like change summaries.
  if (input.body) {
    innerBlocks.push({
      type: "section",
      text: { type: "mrkdwn", text: input.body },
    });
  }

  // Two-column field grid. Slack caps a section's `fields` at 10 entries.
  if (input.fields && input.fields.length > 0) {
    innerBlocks.push({
      type: "section",
      fields: input.fields.slice(0, 10).map((f) => ({
        type: "mrkdwn",
        text: `*${escapeMrkdwn(f.label)}*\n${f.value}`,
      })),
    });
  }

  // Action button.
  if (input.actionUrl) {
    innerBlocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: input.actionLabel ?? "Open task" },
          url: input.actionUrl,
          style: "primary",
        },
      ],
    });
  }

  return {
    // Plain-text fallback for notifications, screen readers, and unfurls.
    text: `${input.contextLine.replace(/[*_`~]/g, "")}: ${input.title}`,
    // Top-level context line ("Lakshay Kapoor created a task") sits above
    // the colored card.
    blocks: [
      {
        type: "context",
        elements: [{ type: "mrkdwn", text: input.contextLine }],
      },
    ],
    attachments: [
      {
        color: input.color,
        blocks: innerBlocks,
      },
    ],
  };
}
