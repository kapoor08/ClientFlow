"use client";

import { useEffect, useMemo, useRef } from "react";
import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react";
import { mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import tippy from "tippy.js";
import type { Instance as TippyInstance } from "tippy.js";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
} from "lucide-react";

// ─── Mention suggestion list ───────────────────────────────────────────────────

type MemberItem = { id: string; name: string };

function MentionListComponent({
  items,
  command,
}: {
  items: MemberItem[];
  command: (item: { id: string; label: string }) => void;
}) {
  if (!items.length) {
    return (
      <div className="min-w-48 rounded-md border border-border bg-card shadow-cf-2 overflow-hidden py-1 px-3 text-xs text-muted-foreground">
        No members found
      </div>
    );
  }
  return (
    <div className="min-w-48 rounded-md border border-border bg-card shadow-cf-2 overflow-hidden py-1">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            command({ id: item.id, label: item.name });
          }}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-secondary transition-colors"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[9px] font-semibold text-primary">
            {item.name.charAt(0).toUpperCase()}
          </span>
          {item.name}
        </button>
      ))}
    </div>
  );
}

// Accept a ref so the suggestion always reads the latest member list,
// even though useEditor only initialises extensions once.
function buildSuggestion(membersRef: React.RefObject<MemberItem[]>) {
  return {
    items({ query }: { query: string }) {
      return (membersRef.current ?? [])
        .filter((m) =>
          m.name.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 6);
    },

    render() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let renderer: ReactRenderer<any>;
      let popup: TippyInstance[];

      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onStart(props: any) {
          renderer = new ReactRenderer(MentionListComponent, {
            props: {
              items: props.items,
              command: props.command,
            },
            editor: props.editor,
          });

          if (!props.clientRect) return;

          popup = tippy("body", {
            getReferenceClientRect: props.clientRect,
            appendTo: () => document.body,
            content: renderer.element,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "bottom-start",
          }) as TippyInstance[];
        },

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onUpdate(props: any) {
          renderer.updateProps({
            items: props.items,
            command: props.command,
          });

          if (!props.clientRect) return;
          popup[0]?.setProps({ getReferenceClientRect: props.clientRect });
        },

        onKeyDown({ event }: { event: KeyboardEvent }) {
          if (event.key === "Escape") {
            popup[0]?.hide();
            return true;
          }
          return renderer.ref?.onKeyDown({ event }) ?? false;
        },

        onExit() {
          popup[0]?.destroy();
          renderer.destroy();
        },
      };
    },
  };
}

// ─── Editor Component ──────────────────────────────────────────────────────────

type TiptapEditorProps = {
  content: string;
  onChange?: (html: string) => void;
  onBlur?: (html: string) => void;
  placeholder?: string;
  members?: MemberItem[];
  minimal?: boolean;
  className?: string;
  editable?: boolean;
};

export function TiptapEditor({
  content,
  onChange,
  onBlur,
  placeholder = "Write something…",
  members = [],
  minimal = false,
  className,
  editable = true,
}: TiptapEditorProps) {
  const isFirstRender = useRef(true);

  // Keep a ref so the suggestion closure always sees the latest list without
  // needing to reinitialise the entire editor.
  const membersRef = useRef<MemberItem[]>(members);
  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  // Extensions are created once — the members ref handles dynamic updates.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const extensions = useMemo(() => [
    StarterKit,
    Placeholder.configure({ placeholder }),
    Mention.configure({
      HTMLAttributes: { class: "mention" },
      renderHTML({ options, node }) {
        return [
          "span",
          mergeAttributes(options.HTMLAttributes),
          `@${node.attrs.label ?? node.attrs.id}`,
        ];
      },
      suggestion: buildSuggestion(membersRef),
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  const editor = useEditor({
    extensions,
    content,
    editable,
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    },
    onBlur({ editor }) {
      onBlur?.(editor.getHTML());
    },
  });

  // Sync external content changes (e.g. when taskId changes)
  useEffect(() => {
    if (!editor) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (editor.getHTML() !== content) {
      editor.commands.setContent(content ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  return (
    <div className={cn("tiptap-wrapper", className)}>
      {/* Toolbar */}
      {editable && !minimal && (
        <div className="flex items-center gap-0.5 border-b border-border px-2 py-1.5">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor?.chain().focus().toggleBold().run();
            }}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded text-xs transition-colors",
              editor?.isActive("bold")
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
            title="Bold"
          >
            <Bold size={13} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor?.chain().focus().toggleItalic().run();
            }}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded text-xs transition-colors",
              editor?.isActive("italic")
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
            title="Italic"
          >
            <Italic size={13} />
          </button>
          <div className="mx-1 h-4 w-px bg-border" />
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor?.chain().focus().toggleBulletList().run();
            }}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded text-xs transition-colors",
              editor?.isActive("bulletList")
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
            title="Bullet list"
          >
            <List size={13} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor?.chain().focus().toggleOrderedList().run();
            }}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded text-xs transition-colors",
              editor?.isActive("orderedList")
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
            title="Ordered list"
          >
            <ListOrdered size={13} />
          </button>
          <span className="ml-auto text-[10px] text-muted-foreground/60 select-none pr-1">
            type @ to mention
          </span>
        </div>
      )}

      <EditorContent
        editor={editor}
        className={cn(
          "tiptap-content",
          minimal ? "px-0 py-0" : "px-3 py-2",
        )}
      />
    </div>
  );
}
