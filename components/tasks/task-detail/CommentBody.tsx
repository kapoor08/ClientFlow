"use client";

import { useRef, useEffect } from "react";
import type { MemberOption } from "./types";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function CommentBody({
  html,
  members,
  className,
}: {
  html: string;
  members: MemberOption[];
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let card: HTMLDivElement | null = null;
    let closeTimer: ReturnType<typeof setTimeout> | null = null;

    function removeCard() {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
      if (card) {
        card.remove();
        card = null;
      }
    }

    function scheduleClose() {
      if (!closeTimer) closeTimer = setTimeout(removeCard, 150);
    }

    function cancelClose() {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
    }

    function showCard(member: MemberOption | null, label: string, rect: DOMRect) {
      removeCard();

      const name = member?.name ?? label;
      const email = member?.email ?? "";
      const role = member?.roleName ?? "";
      const initial = name.charAt(0).toUpperCase();

      card = document.createElement("div");
      card.setAttribute("data-mention-profile", "");
      card.style.cssText = [
        "position:fixed",
        `z-index:99999`,
        "width:224px",
        "border-radius:12px",
        `border:1px solid hsl(var(--border))`,
        `background:hsl(var(--card))`,
        "box-shadow:0 4px 20px rgba(0,0,0,.13)",
        "overflow:hidden",
        `top:${rect.top - 8}px`,
        `left:${rect.left}px`,
        "transform:translateY(-100%)",
      ].join(";");

      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;padding:14px">
          <div style="width:40px;height:40px;border-radius:50%;background:hsl(var(--primary)/0.1);color:hsl(var(--primary));display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;flex-shrink:0">${esc(initial)}</div>
          <div style="min-width:0">
            <p style="margin:0;font-size:14px;font-weight:600;color:hsl(var(--foreground));overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(name)}</p>
            ${email ? `<p style="margin:2px 0 0;font-size:11px;color:hsl(var(--muted-foreground));overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(email)}</p>` : ""}
            ${role ? `<span style="display:inline-block;margin-top:5px;border-radius:999px;background:hsl(var(--secondary));padding:2px 8px;font-size:10px;font-weight:500;color:hsl(var(--secondary-foreground))">${esc(role)}</span>` : ""}
          </div>
        </div>`;

      card.addEventListener("mouseenter", cancelClose);
      card.addEventListener("mouseleave", scheduleClose);
      document.body.appendChild(card);
    }

    const mentions = container.querySelectorAll<HTMLElement>(".mention");
    const cleanups: Array<() => void> = [];

    mentions.forEach((el) => {
      const id = el.getAttribute("data-id");
      const rawLabel = el.getAttribute("data-label") ?? el.textContent?.replace(/^@/, "") ?? "";
      const member = members.find((m) => m.userId === id) ?? null;

      const enter = () => {
        cancelClose();
        showCard(member, rawLabel, el.getBoundingClientRect());
      };
      const leave = () => scheduleClose();

      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
      cleanups.push(() => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      });
    });

    return () => {
      cleanups.forEach((fn) => fn());
      removeCard();
    };
  }, [html, members]);

  return (
    <div ref={containerRef} className={className} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
