"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import { mergeAttributes, Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import Link from "@tiptap/extension-link";
import { cn } from "@/lib/utils";
import { Bold, Italic, List, ListOrdered, Strikethrough, Code, Link2 } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type MemberItem = { id: string; name: string };

type MentionState = {
  items: MemberItem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  command: (item: any) => void;
  position: { top: number; left: number };
  selectedIndex: number;
};

// ─── MentionList — rendered via createPortal inside the same React root ────────
// Being in the same React tree means Radix's onPointerDownCapture fires for
// clicks here, setting isPointerInsideReactTreeRef = true so the dialog never
// treats these clicks as "outside interactions".

function MentionList({
  items,
  selectedIndex,
  command,
}: {
  items: MemberItem[];
  selectedIndex: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  command: (item: any) => void;
}) {
  if (!items.length) {
    return (
      <p className="px-3 py-2 text-xs text-muted-foreground">No members found</p>
    );
  }

  return (
    <>
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            command({ id: item.id, label: item.name });
          }}
          className={cn(
            "flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-foreground transition-colors",
            index === selectedIndex ? "bg-secondary font-medium" : "hover:bg-secondary/60",
          )}
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[9px] font-semibold text-primary">
            {item.name.charAt(0).toUpperCase()}
          </span>
          <span>{item.name}</span>
        </button>
      ))}
    </>
  );
}

// ─── Toolbar button ────────────────────────────────────────────────────────────

function ToolbarButton({
  icon: Icon,
  label,
  active,
  onPress,
  size = 13,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  active?: boolean;
  onPress: () => void;
  size?: number;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded text-xs transition-colors",
        active
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary",
      )}
      title={label}
    >
      <Icon size={size} />
    </button>
  );
}

// ─── Editor Component ──────────────────────────────────────────────────────────

type TiptapEditorProps = {
  content: string;
  onChange?: (html: string) => void;
  onBlur?: (html: string) => void;
  onSubmit?: () => void;
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
  onSubmit,
  placeholder = "Write something…",
  members = [],
  minimal = false,
  className,
  editable = true,
}: TiptapEditorProps) {
  const onSubmitRef = useRef(onSubmit);
  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);
  const isFirstRender = useRef(true);

  const membersRef = useRef<MemberItem[]>(members);
  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  // ── Mention dropdown state (lives in this React tree so createPortal works) ──
  const [mentionState, setMentionState] = useState<MentionState | null>(null);
  const setMentionRef = useRef(setMentionState);
  useEffect(() => {
    setMentionRef.current = setMentionState;
  });

  const extensions = useMemo(
    () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const base: any[] = [
        StarterKit,
        Placeholder.configure({ placeholder }),
        Link.configure({
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { class: "text-primary underline cursor-pointer" },
        }),
        Mention.configure({
          HTMLAttributes: { class: "mention" },
          renderHTML({ options, node }) {
            return [
              "span",
              mergeAttributes(options.HTMLAttributes, {
                "data-id": node.attrs.id,
                "data-label": node.attrs.label ?? node.attrs.id,
              }),
              `@${node.attrs.label ?? node.attrs.id}`,
            ];
          },
          suggestion: {
            items({ query }: { query: string }) {
              return (membersRef.current ?? [])
                .filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 8);
            },

            render() {
              return {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onStart(props: any) {
                  const rect: DOMRect | undefined = props.clientRect?.();
                  setMentionRef.current({
                    items: props.items ?? [],
                    command: props.command,
                    position: rect
                      ? { top: rect.bottom + 6, left: rect.left }
                      : { top: 0, left: 0 },
                    selectedIndex: 0,
                  });
                },

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onUpdate(props: any) {
                  const rect: DOMRect | undefined = props.clientRect?.();
                  setMentionRef.current((prev) =>
                    prev
                      ? {
                          ...prev,
                          items: props.items ?? [],
                          command: props.command,
                          position: rect
                            ? { top: rect.bottom + 6, left: rect.left }
                            : prev.position,
                          selectedIndex: 0,
                        }
                      : null,
                  );
                },

                onKeyDown({ event }: { event: KeyboardEvent }) {
                  if (event.key === "Escape") {
                    setMentionRef.current(null);
                    return true;
                  }
                  if (event.key === "ArrowUp") {
                    setMentionRef.current((prev) =>
                      prev
                        ? {
                            ...prev,
                            selectedIndex:
                              prev.selectedIndex <= 0
                                ? prev.items.length - 1
                                : prev.selectedIndex - 1,
                          }
                        : null,
                    );
                    return true;
                  }
                  if (event.key === "ArrowDown") {
                    setMentionRef.current((prev) =>
                      prev
                        ? {
                            ...prev,
                            selectedIndex:
                              prev.selectedIndex >= prev.items.length - 1
                                ? 0
                                : prev.selectedIndex + 1,
                          }
                        : null,
                    );
                    return true;
                  }
                  if (event.key === "Enter") {
                    setMentionRef.current((prev) => {
                      if (prev) {
                        const item = prev.items[prev.selectedIndex];
                        if (item) prev.command({ id: item.id, label: item.name });
                      }
                      return null;
                    });
                    return true;
                  }
                  return false;
                },

                onExit() {
                  setMentionRef.current(null);
                },
              };
            },
          },
        }),
      ];

      if (minimal) {
        base.push(
          Extension.create({
            name: "enterSubmit",
            addKeyboardShortcuts() {
              return {
                Enter: () => {
                  const fn = onSubmitRef.current;
                  if (fn) { fn(); return true; }
                  return false;
                },
              };
            },
          }),
        );
      }

      return base;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const editor = useEditor({
    extensions,
    content,
    editable,
    immediatelyRender: false,
    onUpdate({ editor }) {
      const html = editor.getHTML();
      queueMicrotask(() => onChange?.(html));
    },
    onBlur({ editor }) {
      onBlur?.(editor.getHTML());
    },
  });

  // Sync external content changes
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
      {editable && !minimal && (
        <div className="flex items-center gap-0.5 border-b border-border px-2 py-1.5">
          <ToolbarButton icon={Bold} label="Bold" active={editor?.isActive("bold")} onPress={() => editor?.chain().focus().toggleBold().run()} />
          <ToolbarButton icon={Italic} label="Italic" active={editor?.isActive("italic")} onPress={() => editor?.chain().focus().toggleItalic().run()} />
          <ToolbarButton icon={Strikethrough} label="Strikethrough" active={editor?.isActive("strike")} onPress={() => editor?.chain().focus().toggleStrike().run()} />
          <ToolbarButton icon={Code} label="Inline code" active={editor?.isActive("code")} onPress={() => editor?.chain().focus().toggleCode().run()} />
          <ToolbarButton
            icon={Link2}
            label="Link"
            active={editor?.isActive("link")}
            onPress={() => {
              if (!editor) return;
              if (editor.isActive("link")) {
                editor.chain().focus().unsetLink().run();
              } else {
                const url = window.prompt("Enter URL");
                if (url) editor.chain().focus().setLink({ href: url }).run();
              }
            }}
          />
          <div className="mx-1 h-4 w-px bg-border" />
          <ToolbarButton icon={List} label="Bullet list" active={editor?.isActive("bulletList")} onPress={() => editor?.chain().focus().toggleBulletList().run()} />
          <ToolbarButton icon={ListOrdered} label="Ordered list" active={editor?.isActive("orderedList")} onPress={() => editor?.chain().focus().toggleOrderedList().run()} />
          <span className="ml-auto text-[10px] text-muted-foreground/60 select-none pr-1">
            type @ to mention
          </span>
        </div>
      )}

      {editable && minimal && (
        <div className="flex items-center gap-0.5 border-b border-border px-2 py-1">
          <ToolbarButton icon={Bold} label="Bold" active={editor?.isActive("bold")} onPress={() => editor?.chain().focus().toggleBold().run()} size={12} />
          <ToolbarButton icon={Italic} label="Italic" active={editor?.isActive("italic")} onPress={() => editor?.chain().focus().toggleItalic().run()} size={12} />
          <ToolbarButton icon={Strikethrough} label="Strikethrough" active={editor?.isActive("strike")} onPress={() => editor?.chain().focus().toggleStrike().run()} size={12} />
          <ToolbarButton icon={Code} label="Inline code" active={editor?.isActive("code")} onPress={() => editor?.chain().focus().toggleCode().run()} size={12} />
          <ToolbarButton
            icon={Link2}
            label="Link"
            active={editor?.isActive("link")}
            size={12}
            onPress={() => {
              if (!editor) return;
              if (editor.isActive("link")) {
                editor.chain().focus().unsetLink().run();
              } else {
                const url = window.prompt("Enter URL");
                if (url) editor.chain().focus().setLink({ href: url }).run();
              }
            }}
          />
          <span className="ml-auto text-[10px] text-muted-foreground/60 select-none pr-1">
            Enter to post · Shift+Enter for newline
          </span>
        </div>
      )}

      <EditorContent
        editor={editor}
        className={cn(
          "tiptap-content",
          minimal ? "tiptap-content-minimal px-0 py-0" : "px-3 py-2",
        )}
      />

      {/* Mention dropdown — rendered via createPortal so it lives in this React
          tree. Radix's onPointerDownCapture fires for mousedown inside portals
          that share the same React root, setting isPointerInsideReactTreeRef=true
          and preventing the dialog from closing on mention item clicks. */}
      {mentionState &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            data-mention-dropdown=""
            style={{
              position: "fixed",
              zIndex: 99999,
              pointerEvents: "auto",
              top: mentionState.position.top,
              left: mentionState.position.left,
              minWidth: "13rem",
              borderRadius: "0.5rem",
              overflow: "hidden",
              border: "1px solid var(--border)",
              background: "var(--card)",
              boxShadow: "var(--shadow-cf-2, 0 4px 16px rgba(0,0,0,.12))",
              padding: "4px 0",
            }}
          >
            <MentionList
              items={mentionState.items}
              selectedIndex={mentionState.selectedIndex}
              command={(item) => {
                mentionState.command(item);
                setMentionState(null);
              }}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
