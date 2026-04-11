"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  WORKSPACE_MODULES,
  PORTAL_MODULES,
  resolveRolePermissions,
  type RolePermissionsConfig,
  type ModulePermissions,
} from "@/config/role-permissions";

type Props = { initialPermissions: RolePermissionsConfig };
type Tab = "manager" | "member" | "client";
const TABS: { key: Tab; label: string }[] = [
  { key: "manager", label: "Manager" },
  { key: "member",  label: "Member"  },
  { key: "client",  label: "Client (Portal)" },
];

export function RolePermissionsEditor({ initialPermissions }: Props) {
  const [config, setConfig] = useState<RolePermissionsConfig>(() =>
    resolveRolePermissions(initialPermissions),
  );
  const [tab, setTab]       = useState<Tab>("manager");
  const [saving, setSaving] = useState(false);

  function setModulePerm(role: Tab, moduleKey: string, patch: Partial<ModulePermissions>) {
    setConfig((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [moduleKey]: { ...(prev[role][moduleKey] ?? {}), ...patch },
      },
    }));
  }

  function toggleVisible(role: Tab, moduleKey: string, value: boolean) {
    setModulePerm(role, moduleKey, {
      visible: value,
      ...(value ? {} : { canCreate: false, canEdit: false, canDelete: false }),
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/role-permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: config }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save.");
      toast.success("Role permissions updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const modules = tab === "client" ? PORTAL_MODULES : WORKSPACE_MODULES;
  const rolePerms = config[tab];

  return (
    <div className="space-y-6">
      {/* Tab strip */}
      <div className="flex gap-1 rounded-lg border border-border bg-secondary/50 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
              tab === t.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Permissions table */}
      <div className="rounded-card border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Module</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Visible</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Create</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Edit</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Delete</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((mod, idx) => {
              const perm = rolePerms[mod.key] ?? { visible: true, canCreate: false, canEdit: false, canDelete: false };
              const disabled = !perm.visible;
              return (
                <tr key={mod.key} className={idx % 2 === 0 ? "" : "bg-secondary/10"}>
                  <td className="px-4 py-3 font-medium text-foreground">{mod.label}</td>
                  <td className="px-4 py-3 text-center">
                    <Switch
                      checked={perm.visible}
                      onCheckedChange={(v) => toggleVisible(tab, mod.key, v)}
                    />
                  </td>
                  <ActionCell enabled={mod.hasCreate && !disabled} checked={perm.canCreate && !disabled}
                    onChange={(v) => setModulePerm(tab, mod.key, { canCreate: v })} />
                  <ActionCell enabled={mod.hasEdit && !disabled} checked={perm.canEdit && !disabled}
                    onChange={(v) => setModulePerm(tab, mod.key, { canEdit: v })} />
                  <ActionCell enabled={mod.hasDelete && !disabled} checked={perm.canDelete && !disabled}
                    onChange={(v) => setModulePerm(tab, mod.key, { canDelete: v })} />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Button onClick={handleSave} disabled={saving} className="cursor-pointer">
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}

function ActionCell({
  enabled,
  checked,
  onChange,
}: {
  enabled: boolean;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  if (!enabled) {
    return <td className="px-4 py-3 text-center text-muted-foreground/40">-</td>;
  }
  return (
    <td className="px-4 py-3 text-center">
      <Switch checked={checked} onCheckedChange={onChange} />
    </td>
  );
}
