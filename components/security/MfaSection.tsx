"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, ShieldOff, Copy, Check, Key, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { authClient } from "@/utils/auth-client";
import { toast } from "sonner";

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer rounded p-1 transition-colors"
      title="Copy"
    >
      {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
    </button>
  );
}

// ─── BackupCodesActions ───────────────────────────────────────────────────────
// Bulk actions for the backup codes list: copy-all to clipboard and download
// as a plain-text file. Gives users a faster path to saving codes safely than
// copying one at a time.

function BackupCodesActions({ codes }: { codes: string[] }) {
  const [copiedAll, setCopiedAll] = useState(false);

  function handleCopyAll() {
    navigator.clipboard.writeText(codes.join("\n"));
    setCopiedAll(true);
    toast.success("All backup codes copied to clipboard.");
    setTimeout(() => setCopiedAll(false), 2000);
  }

  function handleDownload() {
    const header =
      "ClientFlow - 2FA Backup Codes\n" +
      `Generated: ${new Date().toISOString()}\n` +
      "Keep these codes somewhere safe. Each can be used once to sign in\n" +
      "if you lose access to your authenticator app.\n\n";
    const blob = new Blob([header + codes.join("\n") + "\n"], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clientflow-backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopyAll}
        className="cursor-pointer gap-1.5"
      >
        {copiedAll ? <Check size={13} className="text-success" /> : <Copy size={13} />}
        {copiedAll ? "Copied" : "Copy all"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDownload}
        className="cursor-pointer gap-1.5"
      >
        <Download size={13} />
        Download
      </Button>
    </div>
  );
}

// ─── ChangePasswordDialog ─────────────────────────────────────────────────────

function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    onClose();
  }

  async function handleSubmit() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });
      if (res.error) throw new Error(res.error.message ?? "Failed to change password.");
      toast.success("Password changed successfully.");
      handleClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to change password.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>Enter your current password and choose a new one.</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-card border-danger/20 bg-danger/5 text-danger border px-4 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} className="cursor-pointer">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!currentPassword || !newPassword || !confirmPassword || loading}
            className="cursor-pointer"
          >
            {loading ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
            Update Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── MfaSection ───────────────────────────────────────────────────────────────

export function MfaSection({ mfaEnabled }: { mfaEnabled: boolean }) {
  const [enableOpen, setEnableOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [step, setStep] = useState<"password" | "verify" | "backup">("password");
  const [password, setPassword] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [regenPassword, setRegenPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStartEnable() {
    if (!password) return;
    setLoading(true);
    setError(null);
    try {
      const res = await authClient.twoFactor.enable({ password });
      if (res.error) throw new Error(res.error.message ?? "Failed to enable MFA.");
      const uri = (res.data as { totpURI: string; backupCodes: string[] }).totpURI;
      const codes = (res.data as { totpURI: string; backupCodes: string[] }).backupCodes;
      setTotpUri(uri);
      setBackupCodes(codes);
      setStep("verify");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to start MFA setup.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!code) return;
    setLoading(true);
    setError(null);
    try {
      const res = await authClient.twoFactor.verifyTotp({ code });
      if (res.error) throw new Error(res.error.message ?? "Invalid code.");
      setStep("backup");
      toast.success("Two-factor authentication enabled.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Invalid code.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    setLoading(true);
    setError(null);
    try {
      const res = await authClient.twoFactor.disable({ password: disablePassword });
      if (res.error) throw new Error(res.error.message ?? "Failed to disable MFA.");
      setDisableOpen(false);
      setDisablePassword("");
      toast.success("Two-factor authentication disabled.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to disable MFA.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setEnableOpen(false);
    setStep("password");
    setPassword("");
    setCode("");
    setTotpUri("");
    setBackupCodes([]);
    setError(null);
  }

  async function handleRegenerate() {
    if (!regenPassword) return;
    setLoading(true);
    setError(null);
    try {
      const res = await authClient.twoFactor.generateBackupCodes({ password: regenPassword });
      if (res.error) throw new Error(res.error.message ?? "Failed to regenerate backup codes.");
      const codes = (res.data as { backupCodes: string[] }).backupCodes;
      setNewBackupCodes(codes);
      setRegenPassword("");
      toast.success("Backup codes regenerated. Old codes are now invalid.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to regenerate backup codes.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function handleRegenerateClose() {
    setRegenerateOpen(false);
    setRegenPassword("");
    setNewBackupCodes([]);
    setError(null);
  }

  return (
    <>
      {/* 2FA card */}
      <div className="rounded-card border-border bg-card shadow-cf-1 mb-3 border p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${mfaEnabled ? "bg-success/10" : "bg-secondary"}`}
            >
              {mfaEnabled ? (
                <ShieldCheck size={20} className="text-success" />
              ) : (
                <ShieldOff size={20} className="text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-foreground text-sm font-medium">Two-Factor Authentication</p>
              <p className="text-muted-foreground text-xs">
                {mfaEnabled
                  ? "Enabled - your account is protected with TOTP."
                  : "Not enabled - add an extra layer of security."}
              </p>
            </div>
          </div>
          {mfaEnabled ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDisableOpen(true);
                setError(null);
              }}
              className="cursor-pointer"
            >
              Disable
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                setEnableOpen(true);
                setError(null);
                setStep("password");
              }}
              className="cursor-pointer"
            >
              Enable
            </Button>
          )}
        </div>
      </div>

      {/* Backup codes card - shown when MFA is enabled */}
      {mfaEnabled && (
        <div className="rounded-card border-border bg-card shadow-cf-1 mb-3 border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground text-sm font-medium">Backup Codes</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Regenerate your one-time backup codes if you lose access to your authenticator app.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRegenerateOpen(true);
                setError(null);
                setNewBackupCodes([]);
              }}
              className="cursor-pointer"
            >
              Regenerate
            </Button>
          </div>
        </div>
      )}

      {/* Change Password card */}
      <div className="rounded-card border-border bg-card shadow-cf-1 mb-6 border p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-secondary flex h-10 w-10 items-center justify-center rounded-lg">
              <Key size={20} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-foreground text-sm font-medium">Password</p>
              <p className="text-muted-foreground text-xs">
                Update your account password regularly for better security.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChangePasswordOpen(true)}
            className="cursor-pointer"
          >
            Change
          </Button>
        </div>
      </div>

      {/* Change Password dialog */}
      <ChangePasswordDialog
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />

      {/* Enable MFA dialog */}
      <Dialog
        open={enableOpen}
        onOpenChange={(v) => {
          if (!v) handleClose();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              {step === "password" && "Confirm your password to generate a QR code."}
              {step === "verify" &&
                "Scan the QR code with your authenticator app, then enter the 6-digit code."}
              {step === "backup" && "Save your backup codes somewhere safe."}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-card border-danger/20 bg-danger/5 text-danger border px-4 py-2 text-sm">
              {error}
            </div>
          )}

          {step === "password" && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="mfa-password">Current password</Label>
                <Input
                  id="mfa-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStartEnable()}
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleClose} className="cursor-pointer">
                  Cancel
                </Button>
                <Button
                  onClick={handleStartEnable}
                  disabled={!password || loading}
                  className="cursor-pointer"
                >
                  {loading ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
                  Continue
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === "verify" && totpUri && (
            <div className="space-y-4 py-2">
              <div className="flex flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(totpUri)}`}
                  alt="QR Code for authenticator app"
                  width={180}
                  height={180}
                  className="border-border rounded-lg border"
                />
                <p className="text-muted-foreground text-center text-xs">
                  Scan with Google Authenticator, Authy, or any TOTP app.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="totp-code">Verification code</Label>
                <Input
                  id="totp-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center font-mono text-lg tracking-widest"
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleClose} className="cursor-pointer">
                  Cancel
                </Button>
                <Button
                  onClick={handleVerify}
                  disabled={code.length < 6 || loading}
                  className="cursor-pointer"
                >
                  {loading ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
                  Verify
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === "backup" && (
            <div className="space-y-4 py-2">
              <div className="rounded-card border-warning/30 bg-warning/5 border p-3">
                <p className="text-warning text-xs">
                  Save these backup codes. Each can be used once if you lose your authenticator.
                </p>
              </div>
              <BackupCodesActions codes={backupCodes} />
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((c) => (
                  <div
                    key={c}
                    className="border-border bg-secondary/50 flex items-center justify-between rounded-md border px-3 py-1.5"
                  >
                    <span className="text-foreground font-mono text-xs">{c}</span>
                    <CopyButton text={c} />
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button onClick={handleClose} className="cursor-pointer">
                  Done
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Regenerate backup codes dialog */}
      <Dialog
        open={regenerateOpen}
        onOpenChange={(v) => {
          if (!v) handleRegenerateClose();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Regenerate Backup Codes</DialogTitle>
            <DialogDescription>
              {newBackupCodes.length === 0
                ? "This will invalidate your existing backup codes. Enter your password to continue."
                : "Save these codes securely. Your old backup codes are now invalid."}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-card border-danger/20 bg-danger/5 text-danger border px-4 py-2 text-sm">
              {error}
            </div>
          )}

          {newBackupCodes.length === 0 ? (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="regen-password">Current password</Label>
                <Input
                  id="regen-password"
                  type="password"
                  value={regenPassword}
                  onChange={(e) => setRegenPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRegenerate()}
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={handleRegenerateClose}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRegenerate}
                  disabled={!regenPassword || loading}
                  className="cursor-pointer"
                >
                  {loading ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
                  Regenerate
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="rounded-card border-warning/30 bg-warning/5 border p-3">
                <p className="text-warning text-xs">
                  Save these codes now. Each can be used once if you lose your authenticator.
                </p>
              </div>
              <BackupCodesActions codes={newBackupCodes} />
              <div className="grid grid-cols-2 gap-2">
                {newBackupCodes.map((c) => (
                  <div
                    key={c}
                    className="border-border bg-secondary/50 flex items-center justify-between rounded-md border px-3 py-1.5"
                  >
                    <span className="text-foreground font-mono text-xs">{c}</span>
                    <CopyButton text={c} />
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button onClick={handleRegenerateClose} className="cursor-pointer">
                  Done
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable MFA dialog */}
      <AlertDialog
        open={disableOpen}
        onOpenChange={(v) => {
          if (!v) {
            setDisableOpen(false);
            setDisablePassword("");
            setError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Two-Factor Authentication?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove TOTP protection from your account. Enter your password to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <div className="rounded-card border-danger/20 bg-danger/5 text-danger border px-4 py-2 text-sm">
              {error}
            </div>
          )}
          <div className="space-y-2 py-2">
            <Label htmlFor="disable-mfa-password">Current password</Label>
            <Input
              id="disable-mfa-password"
              type="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="cursor-pointer"
              onClick={() => {
                setDisablePassword("");
                setError(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger hover:bg-danger/90 cursor-pointer text-white"
              onClick={handleDisable}
              disabled={!disablePassword || loading}
            >
              {loading ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
              Disable MFA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
