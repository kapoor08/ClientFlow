import "server-only";

/**
 * Adaptive Card builders for Microsoft Teams.
 *
 * Adaptive Cards are Microsoft's cross-product card format. The Power
 * Automate "Post adaptive card in chat or channel" action expects the card
 * wrapped in a Teams message envelope:
 *
 *   { type: "message", attachments: [{ contentType: "...adaptive", content: {...} }] }
 *
 * We build the envelope here so callers stay focused on payload shape.
 *
 * Schema reference: https://adaptivecards.io/explorer/
 * Targeting Adaptive Cards version 1.4 - widely supported by Teams clients
 * across web, desktop, and mobile.
 */

const ADAPTIVE_CARD_VERSION = "1.4";

function envelope(content: Record<string, unknown>): Record<string, unknown> {
  return {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content,
      },
    ],
  };
}

// ─── Simple message (used by /test endpoint) ──────────────────────────────────

export type SimpleMessageInput = {
  title: string;
  body?: string;
  actionUrl?: string;
  actionLabel?: string;
};

export function buildSimpleMessage(input: SimpleMessageInput): Record<string, unknown> {
  const body: Array<Record<string, unknown>> = [
    { type: "TextBlock", text: input.title, weight: "Bolder", size: "Medium", wrap: true },
  ];
  if (input.body) {
    body.push({ type: "TextBlock", text: input.body, wrap: true, isSubtle: true });
  }

  const actions: Array<Record<string, unknown>> = [];
  if (input.actionUrl) {
    actions.push({
      type: "Action.OpenUrl",
      title: input.actionLabel ?? "Open in ClientFlow",
      url: input.actionUrl,
    });
  }

  return envelope({
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: ADAPTIVE_CARD_VERSION,
    body,
    ...(actions.length ? { actions } : {}),
  });
}

// ─── Task card ────────────────────────────────────────────────────────────────

export type TaskCardField = { label: string; value: string };

export type TaskCardInput = {
  /** Top context line, e.g. "Lakshay Kapoor created a task". */
  contextLine: string;
  /** Card title. */
  title: string;
  /** Subtitle, e.g. "Task in Prop Firm Genie". Supports inline links. */
  subtitle?: string;
  /** Compact secondary metadata line (change summary, column move). */
  metaLine?: string;
  /** Primary content body (e.g. comment text). */
  body?: string;
  /** Two-column field grid. */
  fields?: TaskCardField[];
  /** Accent color for the title bar (Adaptive Card "Container.style"). */
  style: "good" | "warning" | "attention" | "accent" | "default";
  /** "Open task" button URL. Omit to render no button. */
  actionUrl?: string;
  actionLabel?: string;
};

/**
 * Adaptive Cards FactSet renders label/value pairs in a clean two-column
 * layout - the Teams equivalent of Slack's section.fields grid. Use this
 * for the Priority/Status/Assignee/Due grid.
 */
function factSet(fields: TaskCardField[]): Record<string, unknown> {
  return {
    type: "FactSet",
    facts: fields.map((f) => ({ title: f.label, value: f.value })),
    spacing: "Medium",
  };
}

export function buildTaskCard(input: TaskCardInput): Record<string, unknown> {
  const body: Array<Record<string, unknown>> = [];

  // Top context line ("Lakshay Kapoor created a task") - styled like Slack's
  // pre-card context block.
  body.push({
    type: "TextBlock",
    text: input.contextLine,
    isSubtle: true,
    size: "Small",
    wrap: true,
  });

  // Colored title container - Adaptive Cards' answer to Slack's sidebar
  // attachment color. The whole title block sits in a tinted container so
  // the event type reads at a glance.
  const titleContainer: Array<Record<string, unknown>> = [
    {
      type: "TextBlock",
      text: input.title,
      weight: "Bolder",
      size: "Medium",
      wrap: true,
      color: "Default",
    },
  ];
  if (input.subtitle) {
    titleContainer.push({
      type: "TextBlock",
      text: input.subtitle,
      isSubtle: true,
      size: "Small",
      wrap: true,
      spacing: "None",
    });
  }
  if (input.metaLine) {
    titleContainer.push({
      type: "TextBlock",
      text: input.metaLine,
      isSubtle: true,
      size: "Small",
      wrap: true,
      spacing: "None",
    });
  }

  body.push({
    type: "Container",
    style: input.style,
    bleed: true,
    items: titleContainer,
  });

  if (input.body) {
    body.push({
      type: "TextBlock",
      text: input.body,
      wrap: true,
      spacing: "Medium",
    });
  }

  if (input.fields && input.fields.length > 0) {
    body.push(factSet(input.fields));
  }

  const actions: Array<Record<string, unknown>> = [];
  if (input.actionUrl) {
    actions.push({
      type: "Action.OpenUrl",
      title: input.actionLabel ?? "Open task",
      url: input.actionUrl,
      style: "positive",
    });
  }

  return envelope({
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: ADAPTIVE_CARD_VERSION,
    body,
    ...(actions.length ? { actions } : {}),
    msteams: { width: "Full" },
  });
}

/**
 * Map task event / priority to an Adaptive Card container style. These map
 * to Teams theme colors: good=green, warning=amber, attention=red,
 * accent=blue, default=neutral.
 */
export function styleForPriority(priority: string | null | undefined): TaskCardInput["style"] {
  switch ((priority ?? "").toLowerCase()) {
    case "urgent":
    case "high":
      return "attention";
    case "medium":
      return "warning";
    case "low":
      return "good";
    default:
      return "accent";
  }
}

/**
 * Visual color cue for priority/status. Same approach as Slack - emoji
 * dots inside FactSet values. Adaptive Cards renders them at the right
 * size automatically.
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
