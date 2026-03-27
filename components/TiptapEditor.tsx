"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react";
import { mergeAttributes, Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import { cn } from "@/lib/utils";
import { Bold, Italic, List, ListOrdered, Strikethrough, Code } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type MemberItem = { id: string; name: string };

// ─── MentionList — rendered in its own React root via ReactRenderer ────────────
// This isolation is critical: Radix's flushSync on the parent tree cannot
// reach this root, so suggestion state is never cleared mid-click.

type MentionListProps = {
  items: MemberItem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  command: (item: any) => void;
};

type MentionListHandle = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

const MentionList = forwardRef<MentionListHandle, MentionListProps>(
  function MentionList({ items, command }, ref) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
      const item = items[index];
      if (item) command({ id: item.id, label: item.name });
    };

    useImperativeHandle(ref, () => ({
      onKeyDown({ event }) {
        if (event.key === "ArrowUp") {
          setSelectedIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((i) => (i >= items.length - 1 ? 0 : i + 1));
          return true;
        }
        if (event.key === "Enter") {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
    }));

    if (!items.length)
      return (
        <p className="px-3 py-2 text-xs text-muted-foreground">No members found</p>
      );

    return (
      <>
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            // onMouseDown keeps editor focused; selectItem calls Tiptap command directly
            onMouseDown={(e) => {
              e.preventDefault();
              selectItem(index);
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
  },
);

// ─── Build suggestion config ───────────────────────────────────────────────────

function buildSuggestion(membersRef: React.RefObject<MemberItem[]>) {
  return {
    items({ query }: { query: string }) {
      return (membersRef.current ?? [])
        .filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8);
    },

    render() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let component: ReactRenderer<MentionListHandle, MentionListProps> | null = null;
      let container: HTMLDivElement | null = null;

      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onStart(props: any) {
          container = document.createElement("div");
          container.setAttribute("data-mention-dropdown", "");
          container.style.cssText =
            "position:fixed;z-index:99999;pointer-events:auto;min-width:13rem;border-radius:0.5rem;overflow:hidden;border:1px solid var(--border);background:var(--card);box-shadow:var(--shadow-cf-2,0 4px 16px rgba(0,0,0,.12));padding:4px 0";
          document.body.appendChild(container);

          component = new ReactRenderer(MentionList, {
            props: { items: props.items ?? [], command: props.command },
            editor: props.editor,
          });
          container.appendChild(component.element);

          const rect: DOMRect = props.clientRect?.();
          if (rect) {
            container.style.top = `${rect.bottom + 6}px`;
            container.style.left = `${rect.left}px`;
          }
        },

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onUpdate(props: any) {
          component?.updateProps({ items: props.items ?? [], command: props.command });

          const rect: DOMRect = props.clientRect?.();
          if (rect && container) {
            container.style.top = `${rect.bottom + 6}px`;
            container.style.left = `${rect.left}px`;
          }
        },

        onKeyDown({ event }: { event: KeyboardEvent }) {
          if (event.key === "Escape") {
            container?.remove();
            return true;
          }
          return component?.ref?.onKeyDown({ event }) ?? false;
        },

        onExit() {
          container?.remove();
          component?.destroy();
          container = null;
          component = null;
        },
      };
    },
  };
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

  const extensions = useMemo(
    () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const base: any[] = [
        StarterKit,
        Placeholder.configure({ placeholder }),
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
          suggestion: buildSuggestion(membersRef),
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
      onChange?.(editor.getHTML());
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
    </div>
  );
}
