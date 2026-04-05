"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Palette, Upload, X, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveBrandingAction } from "./actions";
import { ColorPicker } from "@/components/ui/color-picker";

const PRESET_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#64748b",
];

type Props = {
  defaultLogoUrl: string;
  defaultBrandColor: string;
  canManage: boolean;
};

export default function BrandingForm({
  defaultLogoUrl,
  defaultBrandColor,
  canManage,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [logoUrl, setLogoUrl] = useState(defaultLogoUrl);
  const [brandColor, setBrandColor] = useState(defaultBrandColor || "#6366f1");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Logo must be under 2 MB.");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const signRes = await fetch("/api/files/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "org-logos", resourceType: "image" }),
      });
      if (!signRes.ok) throw new Error("Failed to get upload signature.");
      const { signature, timestamp, apiKey, cloudName, folder } =
        await signRes.json();

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", apiKey);
      form.append("timestamp", String(timestamp));
      form.append("signature", signature);
      form.append("folder", folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: form },
      );
      if (!uploadRes.ok) throw new Error("Upload failed.");
      const uploadData = await uploadRes.json();
      setLogoUrl(uploadData.secure_url as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const saved = await saveBrandingAction({
        logoUrl: logoUrl || null,
        brandColor: brandColor || null,
      });
      // Confirm state from what the server actually persisted
      setLogoUrl(saved.logoUrl ?? "");
      setBrandColor(saved.brandColor ?? "#6366f1");
      setSaved(true);
      toast.success("Branding settings saved.");
      // Router cache was already invalidated by the server action (revalidatePath).
      // refresh() picks up the new RSC payload so the sidebar reflects the change.
      startTransition(() => router.refresh());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Logo */}
      <div className="rounded-card border border-border bg-card p-6 shadow-cf-1">
        <div className="mb-4 flex items-center gap-2">
          <Upload size={16} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">
            Organization Logo
          </h2>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {/* Preview */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Organization logo"
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <Palette size={24} className="text-muted-foreground/40" />
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <Label className="mb-1.5 block">Logo URL</Label>
              <div className="flex gap-2">
                <Input
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/app-logo.png"
                  className="flex-1"
                  disabled={!canManage}
                />
                {logoUrl && canManage && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setLogoUrl("")}
                    className="cursor-pointer"
                  >
                    <X size={14} />
                  </Button>
                )}
              </div>
            </div>

            {canManage && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">or</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={13} className="mr-1.5 animate-spin" />{" "}
                      Uploading…
                    </>
                  ) : (
                    <>
                      <Upload size={13} className="mr-1.5" /> Upload image
                    </>
                  )}
                </Button>
                <span className="text-[11px] text-muted-foreground">
                  PNG, JPG, SVG · max 2 MB
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Brand color */}
      <div className="rounded-card border border-border bg-card p-6 shadow-cf-1">
        <div className="mb-4 flex items-center gap-2">
          <Palette size={16} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Brand Color</h2>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => canManage && setBrandColor(color)}
                disabled={!canManage}
                className="relative h-8 w-8 rounded-full transition-transform enabled:hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: color }}
                title={color}
              >
                {brandColor === color && (
                  <Check
                    size={14}
                    className="absolute inset-0 m-auto text-white"
                    strokeWidth={2.5}
                  />
                )}
              </button>
            ))}
          </div>

          <ColorPicker
            value={brandColor}
            onChange={setBrandColor}
            disabled={!canManage}
          />
        </div>
      </div>

      {/* Save */}
      {canManage && (
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto cursor-pointer"
        >
          {saving ? (
            <>
              <Loader2 size={14} className="mr-1.5 animate-spin" /> Saving…
            </>
          ) : saved ? (
            <>
              <Check size={14} className="mr-1.5" /> Saved
            </>
          ) : (
            "Save Branding"
          )}
        </Button>
      )}
    </div>
  );
}
