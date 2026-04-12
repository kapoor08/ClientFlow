"use client";

import { motion } from "framer-motion";
import { MoreHorizontal } from "lucide-react";
import { PageHeader } from "../shared";

const MEMBERS = [
  { initials: "AD", name: "Aman Deep", email: "aman@yopmail.com", role: "Client", roleStyle: "bg-violet-500/10 text-violet-600", status: "Active", statusStyle: "bg-success/10 text-success", projects: 0, joined: "Mar 29, 2026" },
  { initials: "LK", name: "Lakshay Kapoor", email: "kapoorlakshay2002@gmail.com", role: "Owner", roleStyle: "bg-amber-500/10 text-amber-600", status: "Active", statusStyle: "bg-success/10 text-success", projects: 0, joined: "Mar 15, 2026" },
];

const row = {
  hidden: { opacity: 0 },
  show: (i: number) => ({ opacity: 1, transition: { delay: i * 0.04, duration: 0.2 } }),
};

export function HeroTeamPage() {
  return (
    <div className="hero-preview-scrollbar flex-1 overflow-y-auto p-5">
      <PageHeader title="Team & Roles" description="2 team members" actionLabel="Send Invite" />

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              {["Member", "Role", "Status", "Projects", "Joined", ""].map((h, i) => (
                <th key={i} className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEMBERS.map((m, i) => (
              <motion.tr
                key={m.name}
                custom={i}
                variants={row}
                initial="hidden"
                animate="show"
                className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[5px] font-semibold text-primary">{m.initials}</div>
                    <div>
                      <div className="text-[11px] font-medium text-foreground">{m.name}</div>
                      <div className="text-[9px] text-muted-foreground">{m.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-medium ${m.roleStyle}`}>{m.role}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-medium ${m.statusStyle}`}>{m.status}</span>
                </td>
                <td className="px-4 py-2.5 text-[11px] text-muted-foreground">{m.projects}</td>
                <td className="px-4 py-2.5 text-[10px] text-muted-foreground">{m.joined}</td>
                <td className="px-4 py-2.5">
                  <MoreHorizontal size={7} className="text-muted-foreground/30" />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
