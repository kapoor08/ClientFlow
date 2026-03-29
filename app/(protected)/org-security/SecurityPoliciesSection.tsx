"use client";

import { useState, useEffect } from "react";
import { Shield, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function SecurityPoliciesSection() {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeoutHours, setTimeoutHours] = useState<string>("");
  const [ipInput, setIpInput] = useState("");
  const [ipList, setIpList] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  const { data: policiesData } = useQuery<{
    sessionTimeoutHours: number | null;
    ipAllowlist: string[];
  }>({
    queryKey: ["security-policies"],
    queryFn: () => fetch("/api/settings/security-policies").then((r) => r.json()),
  });

  useEffect(() => {
    if (policiesData && !initialized) {
      setTimeoutHours(policiesData.sessionTimeoutHours ? String(policiesData.sessionTimeoutHours) : "");
      setIpList(policiesData.ipAllowlist ?? []);
      setInitialized(true);
    }
  }, [policiesData, initialized]);

  function addIp() {
    const trimmed = ipInput.trim();
    if (!trimmed || ipList.includes(trimmed)) return;
    setIpList((prev) => [...prev, trimmed]);
    setIpInput("");
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/settings/security-policies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionTimeoutHours: timeoutHours ? Number(timeoutHours) : null,
          ipAllowlist: ipList.length > 0 ? ipList : null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error ?? "Save failed.");
      }
      qc.invalidateQueries({ queryKey: ["security-policies"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast.success("Security policies saved.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Save failed.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-6 rounded-card border border-border bg-card p-5 shadow-cf-1">
      <div className="mb-4 flex items-center gap-2">
        <Shield size={16} className="text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Security Policies</h2>
      </div>

      {error && (
        <div className="mb-4 rounded-card border border-danger/20 bg-danger/5 px-4 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Session timeout */}
        <div className="space-y-2">
          <Label htmlFor="session-timeout">Session Timeout (hours)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="session-timeout"
              type="number"
              min={1}
              max={8760}
              value={timeoutHours}
              onChange={(e) => setTimeoutHours(e.target.value)}
              placeholder="No timeout"
              className="w-40"
            />
            <span className="text-xs text-muted-foreground">Leave blank to disable auto sign-out.</span>
          </div>
        </div>

        {/* IP allowlist */}
        <div className="space-y-2">
          <Label>IP Allowlist</Label>
          <p className="text-xs text-muted-foreground">
            Restrict access to these IP addresses or CIDR ranges. Leave empty to allow all IPs.
          </p>
          <div className="flex gap-2">
            <Input
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addIp()}
              placeholder="192.168.1.0/24"
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={addIp} disabled={!ipInput.trim()}>
              Add
            </Button>
          </div>
          {ipList.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {ipList.map((ip) => (
                <span
                  key={ip}
                  className="flex items-center gap-1 rounded-pill bg-secondary px-2.5 py-1 text-xs font-mono text-foreground"
                >
                  {ip}
                  <button
                    onClick={() => setIpList((prev) => prev.filter((i) => i !== ip))}
                    className="ml-1 text-muted-foreground hover:text-danger"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? (
            <><Loader2 size={13} className="mr-1.5 animate-spin" /> Saving…</>
          ) : saved ? (
            <><Check size={13} className="mr-1.5" /> Saved</>
          ) : (
            "Save Policies"
          )}
        </Button>
      </div>
    </div>
  );
}
