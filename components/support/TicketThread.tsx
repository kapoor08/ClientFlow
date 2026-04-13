"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { replyToTicketAction } from "@/server/actions/support";
import type { PortalTicketMessage } from "@/server/support";

type Props = {
  ticketId: string;
  initialMessages: PortalTicketMessage[];
  isClosed: boolean;
};

export function TicketThread({ ticketId, initialMessages, isClosed }: Props) {
  const [messages, setMessages] = useState<PortalTicketMessage[]>(initialMessages);
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  // SSE subscription for real-time new messages
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    const since = lastMsg
      ? new Date(lastMsg.createdAt).toISOString()
      : new Date(0).toISOString();

    const es = new EventSource(
      `/api/support/tickets/${ticketId}/stream?since=${encodeURIComponent(since)}`,
    );

    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as PortalTicketMessage;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
  }, [ticketId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleReply() {
    if (!body.trim()) return;
    startTransition(async () => {
      const result = await replyToTicketAction({ ticketId, body });
      if (result.error) {
        toast.error(result.error);
      } else {
        setBody("");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Messages */}
      <div className="space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-xl border p-4 ${
              msg.authorRole === "admin"
                ? "border-primary/20 bg-brand-100/30"
                : "border-border bg-card"
            }`}
          >
            <div className="mb-1.5 flex items-center gap-2">
              <span
                className={`text-xs font-semibold ${
                  msg.authorRole === "admin" ? "text-primary" : "text-foreground"
                }`}
              >
                {msg.authorRole === "admin" ? "Support Team" : (msg.authorName ?? "You")}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">{msg.body}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply form */}
      {!isClosed && (
        <div className="rounded-xl border border-border bg-card p-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type your reply…"
            rows={3}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleReply();
            }}
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">⌘Enter to send</p>
            <Button
              size="sm"
              onClick={handleReply}
              disabled={isPending || !body.trim()}
              className="gap-1.5"
            >
              <Send size={12} />
              {isPending ? "Sending…" : "Send"}
            </Button>
          </div>
        </div>
      )}

      {isClosed && (
        <p className="rounded-xl border border-border bg-secondary/30 px-4 py-3 text-center text-sm text-muted-foreground">
          This ticket is closed. Create a new ticket if you need further help.
        </p>
      )}
    </div>
  );
}
