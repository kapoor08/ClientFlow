"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Settings2, RotateCcw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  WORKSPACE_MODULES,
  PORTAL_MODULES,
  resolveMemberEffectivePermissions,
  type RolePermissionsConfig,
  type MemberPermissionOverrides,
  type ModulePermissions,
} from "@/config/role-permissions";
import { ROLE_BADGE } from "@/components/teams";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  membershipId: string;
  memberName: string;
  roleKey: string;
  roleName: string;
  orgRolePermissions: RolePermissionsConfig | null;
  initialOverrides: MemberPermissionOverrides | null;
  onSaved?: (overrides: MemberPermissionOverrides | null) => void;
};

export function MemberPermissionsDialog({
  open, onOpenChange,
  membershipId, memberName, roleKey, roleName,
  orgRolePermissions, initialOverrides, onSaved,
}: Props) {
  // effective = role defaults + initial overrides
  const [effective, setEffective] = useState<Record<string, ModulePermissions>>(() =>
    resolveMemberEffectivePermissions(roleKey, orgRolePermissions, initialOverrides),
  );
  const [saving, setSaving] = useState(false);

  const modules = roleKey === "client" ? PORTAL_MODULES : WORKSPACE_MODULES;

  function toggle(moduleKey: string, field: keyof ModulePermissions, value: boolean) {
    setEffective((prev) => {
      const cur = prev[moduleKey] ?? { visible: true, canCreate: false, canEdit: false, canDelete: false };
      const next = { ...cur, [field]: value };
      // If hiding module, disable all actions
      if (field === "visible" && !value) {
        next.canCreate = false;
        next.canEdit = false;
        next.canDelete = false;
      }
      return { ...prev, [moduleKey]: next };
    });
  }

  function handleReset() {
    setEffective(resolveMemberEffectivePermissions(roleKey, orgRolePermissions, null));
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Build overrides from the effective state (store full snapshot)
      const overrides: MemberPermissionOverrides = {};
      for (const mod of modules) {
        const perm = effective[mod.key];
        if (perm) overrides[mod.key] = perm;
      }

      const res = await fetch(`/api/team/${membershipId}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrides }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save.");
      toast.success("Member permissions updated.");
      onSaved?.(overrides);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleClearOverrides() {
    setSaving(true);
    try {
      const res = await fetch(`/api/team/${membershipId}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrides: null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to reset.");
      toast.success("Permissions reset to role defaults.");
      handleReset();
      onSaved?.(null);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 size={18} />
            Custom Permissions - {memberName}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <span
              className={`inline-flex rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${ROLE_BADGE[roleKey] ?? "bg-secondary text-foreground"}`}
            >
              {roleName}
            </span>
            <span>Overrides apply on top of the {roleName} role defaults.</span>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 overflow-hidden rounded-card border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Module</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Visible</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Create</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Edit</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Delete</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((mod, idx) => {
                const perm = effective[mod.key] ?? { visible: true, canCreate: false, canEdit: false, canDelete: false };
                const hidden = !perm.visible;
                return (
                  <tr key={mod.key} className={idx % 2 === 0 ? "" : "bg-secondary/10"}>
                    <td className="px-4 py-2.5 font-medium text-foreground">{mod.label}</td>
                    <td className="px-4 py-2.5 text-center">
                      <Switch checked={perm.visible} onCheckedChange={(v) => toggle(mod.key, "visible", v)} />
                    </td>
                    <ActionCell enabled={mod.hasCreate && !hidden} checked={perm.canCreate}
                      onChange={(v) => toggle(mod.key, "canCreate", v)} />
                    <ActionCell enabled={mod.hasEdit && !hidden} checked={perm.canEdit}
                      onChange={(v) => toggle(mod.key, "canEdit", v)} />
                    <ActionCell enabled={mod.hasDelete && !hidden} checked={perm.canDelete}
                      onChange={(v) => toggle(mod.key, "canDelete", v)} />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={handleClearOverrides} disabled={saving} className="gap-1.5 text-muted-foreground cursor-pointer">
            <RotateCcw size={13} /> Reset to role defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="cursor-pointer">
              {saving ? "Saving..." : "Save Permissions"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ActionCell({ enabled, checked, onChange }: { enabled: boolean; checked: boolean; onChange: (v: boolean) => void }) {
  if (!enabled) return <td className="px-4 py-2.5 text-center text-muted-foreground/40">-</td>;
  return (
    <td className="px-4 py-2.5 text-center">
      <Switch checked={checked} onCheckedChange={onChange} />
    </td>
  );
}
