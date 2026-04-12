"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Building2, ChevronDown, Check, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export type OrgOption = {
  id: string;
  name: string;
  roleKey: string | null;
  logoUrl: string | null;
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  member: "Member",
  client: "Client",
};

function getHomeHref(roleKey: string | null) {
  return roleKey === "client" ? "/client-portal" : "/dashboard";
}

export function OrgSwitcher({
  orgs,
  activeOrgId,
}: {
  orgs: OrgOption[];
  activeOrgId: string;
}) {
  const router = useRouter();
  const [switching, setSwitching] = useState<string | null>(null);

  const activeOrg = orgs.find((o) => o.id === activeOrgId) ?? orgs[0];

  async function handleSwitch(org: OrgOption) {
    if (org.id === activeOrgId || switching) return;
    setSwitching(org.id);
    try {
      const res = await fetch("/api/org/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: org.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(
          (data as { error?: string }).error ?? "Failed to switch organization.",
        );
        return;
      }
      router.push(getHomeHref(org.roleKey));
      router.refresh();
    } catch {
      toast.error("Failed to switch organization.");
    } finally {
      setSwitching(null);
    }
  }

  // Only render if user belongs to more than one org
  if (orgs.length <= 1) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-sm font-medium max-w-50 cursor-pointer"
          disabled={!!switching}
        >
          {switching ? (
            <Loader2 size={14} className="animate-spin text-muted-foreground" />
          ) : (
            <Building2 size={14} className="shrink-0 text-muted-foreground" />
          )}
          <span className="truncate">{activeOrg?.name}</span>
          <ChevronDown size={12} className="shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Your workspaces
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {orgs.map((org) => {
          const isActive = org.id === activeOrgId;
          return (
            <DropdownMenuItem
              key={org.id}
              onClick={() => handleSwitch(org)}
              className="flex cursor-pointer items-center justify-between gap-3 py-2.5 hover:bg-primary"
              disabled={isActive || !!switching}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-none">
                  {org.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {ROLE_LABELS[org.roleKey ?? ""] ?? "Member"}
                </p>
              </div>
              {isActive && (
                <Check size={14} className="shrink-0 text-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
